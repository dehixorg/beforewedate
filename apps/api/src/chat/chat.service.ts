import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { AzureService } from '../azure/azure.service';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { CoachService } from '../coach/coach.service';

@Injectable()
export class ChatService {
  private supabaseAdmin;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly azureService: AzureService,
    private readonly configService: ConfigService,
    private readonly coachService: CoachService
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async sendMessage(senderId: string, matchId: string, text: string) {
    // 1. Run through Azure Content Safety
    try {
      const analysis = await this.azureService.contentSafetyClient.analyzeText(text);
      
      // analysis returns categoriesResults array like: [{ category: 'Hate', severity: 0 }, ...]
      let maxSeverity = 0;
      let worstCategory = '';

      if (analysis && analysis.categoriesAnalysis) {
        for (const cat of analysis.categoriesAnalysis) {
          if (cat.severity > maxSeverity) {
            maxSeverity = cat.severity;
            worstCategory = cat.category;
          }
        }
      }

      // Threshold: 4 (Medium) or 6 (High) gets blocked
      if (maxSeverity >= 4) {
        this.logger.warn(`Message blocked for ${worstCategory} (Severity: ${maxSeverity})`);
        
        // Find who they were talking to, to log the report properly
        const { data: matchData } = await this.supabaseAdmin
          .from('matches')
          .select('user_a, user_b')
          .eq('id', matchId)
          .single();

        let reportedId = senderId;
        
        // Auto-log to reports queue
        await this.supabaseAdmin.from('reports').insert({
          reporter_id: null, // System generated
          reported_id: reportedId,
          match_id: matchId,
          reason: `Auto-flagged: ${worstCategory} (Severity ${maxSeverity})`,
          message_context: text,
          status: 'pending'
        });

        throw new HttpException('Message blocked by moderation', HttpStatus.BAD_REQUEST);
      } else if (maxSeverity === 2) {
        // Low severity - allow message, but trigger passive coach
        this.logger.log(`Tension detected (Severity: 2). Triggering Coach de-escalation.`);
        this.coachService.triggerDeescalation(matchId, text).catch(err => {
          this.logger.error('Coach de-escalation failed', err);
        });
      }
    } catch (e) {
      if (e instanceof HttpException) throw e;
      this.logger.error('Azure Content Safety Error:', e);
      // Fail-open or fail-closed? For safety-first app, fail-closed.
      throw new HttpException('Moderation service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }

    // 2. Insert into messages (bypassing RLS since we use service_role)
    const { data, error } = await this.supabaseAdmin
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        text,
        is_ai: false
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Insert error', error);
      throw new HttpException('Database error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  async reportUser(reporterId: string, reportedId: string, reason: string, matchId?: string) {
    // Insert report
    await this.supabaseAdmin.from('reports').insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      match_id: matchId || null,
      reason,
      status: 'pending'
    });

    // If match provided, soft delete or pause it
    if (matchId) {
      // Just delete the match for now on block to immediately end chat access
      await this.supabaseAdmin.from('matches').delete().eq('id', matchId);
    }

    return { success: true };
  }
}
