import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AzureService } from '../azure/azure.service';
import { MemoryService } from './memory.service';

@Injectable()
export class DarkRoomService {
  private supabaseAdmin;
  private readonly logger = new Logger(DarkRoomService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly azureService: AzureService,
    private readonly memoryService: MemoryService
  ) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async startSession(relationshipId: string, userId: string) {
    // Verify relationship
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('id, user_a, user_b')
      .eq('id', relationshipId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single();

    if (!rel) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { data: session } = await this.supabaseAdmin
      .from('dark_room_sessions')
      .insert({ relationship_id: relationshipId, status: 'active' })
      .select()
      .single();

    // Initial Coach Greeting
    await this.supabaseAdmin.from('dark_room_messages').insert({
      session_id: session.id,
      is_ai: true,
      text: "Welcome to the Dark Room. I am your facilitator. What would you two like to discuss today?"
    });

    return session;
  }

  async handleMessage(sessionId: string, userId: string, text: string) {
    // 1. Save User Message
    await this.supabaseAdmin.from('dark_room_messages').insert({
      session_id: sessionId,
      sender_id: userId,
      is_ai: false,
      text
    });

    // 2. Fetch Session & Relationship
    const { data: session } = await this.supabaseAdmin
      .from('dark_room_sessions')
      .select('*, relationships(id, user_a, user_b)')
      .eq('id', sessionId)
      .single();

    if (session.status !== 'active') throw new HttpException('Session is not active', HttpStatus.BAD_REQUEST);

    // 3. Fetch recent transcript
    const { data: rawMessages } = await this.supabaseAdmin
      .from('dark_room_messages')
      .select('sender_id, text, is_ai')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20);

    const transcript = (rawMessages || []).reverse().map(m => {
      const role = m.is_ai ? 'Coach' : (m.sender_id === session.relationships.user_a ? 'Partner A' : 'Partner B');
      return `${role}: ${m.text}`;
    }).join('\n');

    // 4. Fetch Memory
    const coupleMemory = await this.memoryService.searchMemory(text, 'couple', session.relationships.id);

    // 5. Generate Response (Foundry Agent)
    const promptMessages = [
      {
        role: 'system',
        content: `You are the Dark Room Facilitator for BeforeWeDate. 
Your role is to mediate conflicts between Partner A and Partner B.
RULES:
1. You are NOT a therapist. You do NOT give clinical advice.
2. You point the humans back toward each other. Ask them to reflect on what the other just said.
3. Keep it brief. 1-3 sentences max.
4. Here is what worked for them in the past: ${JSON.stringify(coupleMemory)}`
      },
      {
        role: 'user',
        content: `Recent Transcript:\n${transcript}\n\nProvide the next facilitator nudge if appropriate, or briefly ask them to respond to each other.`
      }
    ];

    const reply = await this.azureService.chatClient.generateChatCompletion(promptMessages);

    // 6. Save AI Message
    await this.supabaseAdmin.from('dark_room_messages').insert({
      session_id: sessionId,
      is_ai: true,
      text: reply
    });

    return { success: true };
  }

  async proposeSummary(sessionId: string, userId: string) {
    // Set to pending consent
    await this.supabaseAdmin
      .from('dark_room_sessions')
      .update({ status: 'pending_consent' })
      .eq('id', sessionId);

    // Fetch full transcript
    const { data: rawMessages } = await this.supabaseAdmin
      .from('dark_room_messages')
      .select('sender_id, text, is_ai')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    const transcript = (rawMessages || []).map(m => `${m.is_ai ? 'Coach' : 'Partner'}: ${m.text}`).join('\n');

    // Generate Proposal
    const promptMessages = [
      {
        role: 'system',
        content: `Extract exactly ONE sentence describing what communication tactic worked for this couple during this conflict resolution session. Focus on the positive. If nothing worked, say "No clear resolution tactic emerged."`
      },
      { role: 'user', content: transcript }
    ];

    const summary = await this.azureService.chatClient.generateChatCompletion(promptMessages);

    return { proposed_summary: summary };
  }

  async handleConsent(sessionId: string, userId: string, approve: boolean, summary: string) {
    const { data: session } = await this.supabaseAdmin
      .from('dark_room_sessions')
      .select('*, relationships(id)')
      .eq('id', sessionId)
      .single();

    if (approve && summary && summary !== "No clear resolution tactic emerged.") {
      // Store in memory (MemoryService will embed it)
      await this.memoryService.extractAndStoreMemory(summary, 'couple', session.relationships.id, 'resolution');
    }

    // Move to completed. THE DB TRIGGER WILL INSTANTLY PURGE ALL RAW MESSAGES.
    await this.supabaseAdmin
      .from('dark_room_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);

    return { success: true, purged: true };
  }
}
