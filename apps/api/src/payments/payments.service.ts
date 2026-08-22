import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  private supabaseAdmin;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async subscribe(userId: string) {
    // 1. Record Transaction (Simulated Gateway)
    const { error: txError } = await this.supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        item_type: 'subscription',
        amount: 14.99, // e.g. BeforeWeDate+ Monthly
        status: 'completed'
      });

    if (txError) throw new HttpException('Payment failed', HttpStatus.BAD_REQUEST);

    // 2. Upgrade Profile
    const { error: updateError } = await this.supabaseAdmin
      .from('profiles')
      .update({ is_premium: true })
      .eq('user_id', userId);

    if (updateError) throw new HttpException('Failed to upgrade profile', HttpStatus.INTERNAL_SERVER_ERROR);

    return { success: true, message: 'Welcome to BeforeWeDate+' };
  }

  async purchaseItem(userId: string, itemType: 'extend_match' | 'compliment', matchId?: string, targetUserId?: string) {
    const amount = itemType === 'extend_match' ? 0.99 : 1.99;

    // 1. Record Transaction
    const { error: txError } = await this.supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        item_type: itemType,
        amount,
        status: 'completed'
      });

    if (txError) throw new HttpException('Payment failed', HttpStatus.BAD_REQUEST);

    // 2. Apply Effect
    if (itemType === 'extend_match' && matchId) {
      // Extend match expiration by 24h
      const { data: match } = await this.supabaseAdmin
        .from('matches')
        .select('expires_at')
        .eq('id', matchId)
        .single();
        
      if (match) {
        const newExpiry = new Date(match.expires_at);
        newExpiry.setHours(newExpiry.getHours() + 24);
        
        await this.supabaseAdmin
          .from('matches')
          .update({ expires_at: newExpiry.toISOString() })
          .eq('id', matchId);
      }
    } else if (itemType === 'compliment' && targetUserId) {
      // Create a 'like' interaction with the compliment metadata (in a real system we might store the text in another column)
      // For MVP, just recording the transaction is sufficient to trigger the compliment UI flow
      await this.supabaseAdmin
        .from('interactions')
        .insert({
          from_user_id: userId,
          to_user_id: targetUserId,
          type: 'like'
        });
    }

    return { success: true };
  }
}
