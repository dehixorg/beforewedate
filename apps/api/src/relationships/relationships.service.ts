import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RelationshipsService {
  public supabaseAdmin;
  private readonly logger = new Logger(RelationshipsService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async goOfficial(matchId: string, userId: string) {
    // Determine if user is user_a or user_b
    const { data: match } = await this.supabaseAdmin
      .from('matches')
      .select('user_a, user_b')
      .eq('id', matchId)
      .single();

    if (!match) throw new HttpException('Match not found', HttpStatus.NOT_FOUND);

    const updateField = match.user_a === userId ? { go_official_a: true } : { go_official_b: true };

    const { data, error } = await this.supabaseAdmin
      .from('matches')
      .update(updateField)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to go official', error);
      throw new HttpException('Failed to update match', HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async pause(relId: string, userId: string) {
    // Get relationship
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('*')
      .eq('id', relId)
      .single();
    
    if (!rel || (rel.user_a !== userId && rel.user_b !== userId)) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (rel.state === 'ended') throw new HttpException('Relationship is already ended', HttpStatus.BAD_REQUEST);

    const { data, error } = await this.supabaseAdmin
      .from('relationships')
      .update({ state: 'paused', paused_at: new Date().toISOString(), initiated_by: userId })
      .eq('id', relId)
      .select()
      .single();
      
    if (error) throw new HttpException('Failed to pause', HttpStatus.BAD_REQUEST);
    return data;
  }

  async unpause(relId: string, userId: string) {
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('*')
      .eq('id', relId)
      .single();
    
    if (!rel || (rel.user_a !== userId && rel.user_b !== userId)) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (rel.state !== 'paused') throw new HttpException('Relationship is not paused', HttpStatus.BAD_REQUEST);

    // Hard 48h check
    const pausedAt = new Date(rel.paused_at).getTime();
    const now = new Date().getTime();
    const hoursSincePause = (now - pausedAt) / (1000 * 60 * 60);

    if (hoursSincePause < 48) {
      throw new HttpException(`Cannot unpause yet. Must wait 48 hours. Remaining: ${Math.ceil(48 - hoursSincePause)}h`, HttpStatus.BAD_REQUEST);
    }

    const { data, error } = await this.supabaseAdmin
      .from('relationships')
      .update({ state: 'official', paused_at: null, initiated_by: userId })
      .eq('id', relId)
      .select()
      .single();

    if (error) throw new HttpException('Failed to unpause', HttpStatus.BAD_REQUEST);
    return data;
  }

  async end(relId: string, userId: string) {
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('*')
      .eq('id', relId)
      .single();
    
    if (!rel || (rel.user_a !== userId && rel.user_b !== userId)) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // End relationship
    const { data, error } = await this.supabaseAdmin
      .from('relationships')
      .update({ state: 'ended', ended_at: new Date().toISOString(), initiated_by: userId })
      .eq('id', relId)
      .select()
      .single();

    if (error) throw new HttpException('Failed to end', HttpStatus.BAD_REQUEST);

    // Put both users back on the market
    await this.supabaseAdmin
      .from('users')
      .update({ status: 'dating' })
      .in('id', [rel.user_a, rel.user_b]);

    return data;
  }
}
