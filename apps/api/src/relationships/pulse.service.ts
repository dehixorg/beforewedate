import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AzureService } from '../azure/azure.service';

@Injectable()
export class PulseService {
  private supabaseAdmin;
  private readonly logger = new Logger(PulseService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly azureService: AzureService
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async logPulse(relId: string, userId: string, score: number, note: string) {
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('id')
      .eq('id', relId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single();

    if (!rel) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { data, error } = await this.supabaseAdmin
      .from('pulse')
      .insert({ relationship_id: relId, user_id: userId, score, note })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to log pulse', error);
      throw new HttpException('Failed to save pulse', HttpStatus.BAD_REQUEST);
    }

    return { success: true };
  }

  async generateInsight(relId: string, userId: string) {
    // 1. Verify user is in relationship
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('id, user_a, user_b')
      .eq('id', relId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single();

    if (!rel) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    // 2. Fetch last 14 days of pulses for BOTH users (using service_role)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: pulses } = await this.supabaseAdmin
      .from('pulse')
      .select('user_id, score, note, created_at')
      .eq('relationship_id', relId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (!pulses || pulses.length < 2) {
      return { insight: "Not enough data yet. Keep logging your daily pulse!" };
    }

    // 3. Anonymize for the prompt
    const timeline = pulses.map(p => {
      const role = p.user_id === rel.user_a ? 'Partner A' : 'Partner B';
      return `Date: ${new Date(p.created_at).toLocaleDateString()}, Person: ${role}, Score: ${p.score}/5, Note: "${p.note || ''}"`;
    }).join('\n');

    // 4. Generate Insight via Azure
    const promptMessages = [
      {
        role: 'system',
        content: `You are the AI Coach for a couple. Review their private feeling tracker timeline.
RULES:
1. DO NOT reveal specific raw scores or quote private notes verbatim. 
2. Look for overall trends (e.g., rising stress, disconnection, or sustained happiness).
3. Provide a single, gentle 1-2 sentence nudge summarizing the relationship's temperature and suggesting a proactive check-in if needed.
4. Keep the tone warm and supportive.`
      },
      {
        role: 'user',
        content: `Timeline:\n${timeline}`
      }
    ];

    try {
      const insight = await this.azureService.chatClient.generateChatCompletion(promptMessages);
      return { insight };
    } catch (e) {
      this.logger.error('Failed to generate pulse insight', e);
      return { insight: "The Coach is currently analyzing your trends..." };
    }
  }
}
