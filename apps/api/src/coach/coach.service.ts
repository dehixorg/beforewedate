import { Injectable, Logger } from '@nestjs/common';
import { AzureService } from '../azure/azure.service';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { MemoryService } from './memory.service';

@Injectable()
export class CoachService {
  private supabaseAdmin;
  private readonly logger = new Logger(CoachService.name);

  constructor(
    private readonly azureService: AzureService,
    private readonly configService: ConfigService,
    private readonly memoryService: MemoryService
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  private async fetchContext(matchId: string) {
    // Fetch match
    const { data: match } = await this.supabaseAdmin
      .from('matches')
      .select('user_a, user_b')
      .eq('id', matchId)
      .single();

    if (!match) throw new Error('Match not found');

    // Fetch profiles
    const { data: profiles } = await this.supabaseAdmin
      .from('profiles')
      .select('user_id, bio, prompts')
      .in('user_id', [match.user_a, match.user_b]);

    // Fetch last 10 messages
    const { data: messages } = await this.supabaseAdmin
      .from('messages')
      .select('sender_id, text, is_ai')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(10);

    return { match, profiles, messages: messages?.reverse() || [] };
  }

  async triggerManualIcebreaker(requesterId: string, matchId: string) {
    // 1. Check Premium Gating
    const { data: profile } = await this.supabaseAdmin
      .from('profiles')
      .select('is_premium')
      .eq('user_id', requesterId)
      .single();

    if (!profile?.is_premium) {
      const { count } = await this.supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('is_ai', true);

      if (count !== null && count >= 3) {
        await this.supabaseAdmin.from('messages').insert({
          match_id: matchId,
          sender_id: null,
          is_ai: true,
          text: 'Coach limit reached. Upgrade to BeforeWeDate+ to unlock unlimited AI Coach sessions! 🤖✨'
        });
        return;
      }
    }

    const context = await this.fetchContext(matchId);
    
    let chatHistoryStr = context.messages.map(m => {
      const role = m.is_ai ? 'Coach' : (m.sender_id === context.match.user_a ? 'User A' : 'User B');
      return `${role}: ${m.text}`;
    }).join('\n');

    const promptMessages = [
      {
        role: 'system',
        content: `You are the AI Coach for "BeforeWeDate". You are a warm, empathetic facilitator helping two humans connect.
Do NOT speak for the users. Do NOT answer questions on their behalf. You are a facilitator, point them toward each other.
Keep your message brief (1-2 sentences) and gentle.
Here is User A's profile: ${JSON.stringify(context.profiles?.find(p => p.user_id === context.match.user_a))}
Here is User B's profile: ${JSON.stringify(context.profiles?.find(p => p.user_id === context.match.user_b))}

Relevant Coach Memory for User A: ${JSON.stringify(await this.memoryService.searchMemory(chatHistoryStr, 'user', context.match.user_a))}
Relevant Coach Memory for User B: ${JSON.stringify(await this.memoryService.searchMemory(chatHistoryStr, 'user', context.match.user_b))}
`
      },
      {
        role: 'user',
        content: `The users requested an icebreaker or nudge. Here is the recent chat history:\n${chatHistoryStr}\n\nProvide a warm icebreaker or question to help them connect.`
      }
    ];

    await this.generateAndInsert(matchId, promptMessages);
  }

  async triggerDeescalation(matchId: string, triggerMessage: string) {
    const context = await this.fetchContext(matchId);
    
    let chatHistoryStr = context.messages.map(m => {
      const role = m.is_ai ? 'Coach' : (m.sender_id === context.match.user_a ? 'User A' : 'User B');
      return `${role}: ${m.text}`;
    }).join('\n');

    const promptMessages = [
      {
        role: 'system',
        content: `You are the AI Coach for "BeforeWeDate". You are a warm, empathetic facilitator helping two humans connect.
Do NOT speak for the users. Do NOT answer questions on their behalf.
The moderation system detected rising tension in the chat. Provide a VERY gentle, passive de-escalation nudge to redirect the conversation positively.`
      },
      {
        role: 'user',
        content: `Recent chat history:\n${chatHistoryStr}\n\nThe message that triggered this: "${triggerMessage}"\n\nProvide a brief, warm de-escalation nudge.`
      }
    ];

    await this.generateAndInsert(matchId, promptMessages);
  }

  private async generateAndInsert(matchId: string, messages: any[]) {
    try {
      const reply = await this.azureService.chatClient.generateChatCompletion(messages);
      
      await this.supabaseAdmin.from('messages').insert({
        match_id: matchId,
        sender_id: null,
        is_ai: true,
        text: reply
      });
    } catch (e) {
      this.logger.error('Failed to generate coach response', e);
    }
  }
}
