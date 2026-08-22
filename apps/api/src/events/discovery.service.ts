import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscoveryService {
  private supabaseAdmin;
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async toggleOptIn(eventId: string, userId: string, optIn: boolean) {
    const { data, error } = await this.supabaseAdmin
      .from('event_checkins')
      .update({ discovery_opt_in: optIn })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to toggle opt-in', error);
      throw new HttpException('Failed to update Discovery status', HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async getCandidates(eventId: string, userId: string) {
    // Note: We use auth.uid() in the RPC, but from NestJS using service_role, we need to pass it or mock it.
    // Wait, since we are calling it from NestJS with service_role, auth.uid() will be null.
    // Let's call the RPC directly with REST and set the Authorization header, OR rewrite the RPC to accept user_id, OR just query directly in NestJS.
    // Querying directly in NestJS is safer since we have service_role and know the userId.

    const { data: checkin } = await this.supabaseAdmin
      .from('event_checkins')
      .select('discovery_opt_in')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (!checkin?.discovery_opt_in) {
      return []; // Must be opted in
    }

    // Get previous interactions
    const { data: interactions } = await this.supabaseAdmin
      .from('event_interactions')
      .select('to_user_id')
      .eq('event_id', eventId)
      .eq('from_user_id', userId);
      
    const ignoreIds = (interactions || []).map(i => i.to_user_id);
    ignoreIds.push(userId); // ignore self

    // Get opted in checkins
    const { data: candidates, error } = await this.supabaseAdmin
      .from('event_checkins')
      .select('user_id, profiles(bio)')
      .eq('event_id', eventId)
      .eq('discovery_opt_in', true)
      .not('user_id', 'in', `(${ignoreIds.join(',')})`);

    if (error) {
      this.logger.error('Candidate fetch error', error);
      return [];
    }

    // Map to anonymous alias
    return candidates.map(c => ({
      user_id: c.user_id,
      alias: `Guest ${c.user_id.substring(c.user_id.length - 4).toUpperCase()}`,
      bio_snippet: c.profiles?.bio?.substring(0, 50) || ''
    }));
  }

  async likeCandidate(eventId: string, userId: string, toUserId: string) {
    // 1. Record the like
    await this.supabaseAdmin
      .from('event_interactions')
      .insert({ event_id: eventId, from_user_id: userId, to_user_id: toUserId, action: 'like' });

    // 2. Check for mutual like
    const { data: mutual } = await this.supabaseAdmin
      .from('event_interactions')
      .select('id')
      .eq('event_id', eventId)
      .eq('from_user_id', toUserId)
      .eq('to_user_id', userId)
      .eq('action', 'like')
      .single();

    if (mutual) {
      // 3. Create Match and pick a meetup point
      const { data: event } = await this.supabaseAdmin
        .from('events')
        .select('venues(meetup_points)')
        .eq('id', eventId)
        .single();
        
      const points = event?.venues?.meetup_points || ['By the entrance'];
      const randomPoint = points[Math.floor(Math.random() * points.length)];

      const { data: match } = await this.supabaseAdmin
        .from('event_matches')
        .insert({
          event_id: eventId,
          user_a: userId,
          user_b: toUserId,
          meetup_point: randomPoint
        })
        .select()
        .single();

      return { match: true, meetup_point: randomPoint };
    }

    return { match: false };
  }

  async processHeartbeat(eventId: string, userId: string, lat: number, lng: number) {
    // Use the existing checkin RPC which throws if outside geofence
    try {
      await this.supabaseAdmin.rpc('checkin_to_event', {
        target_event_id: eventId,
        lat,
        lng
      });
      return { success: true };
    } catch (e: any) {
      // If it fails, they are outside the radius. Force opt-out.
      this.logger.log(`User ${userId} left geofence for event ${eventId}. Auto-opting out.`);
      await this.toggleOptIn(eventId, userId, false);
      return { success: false, reason: 'Exited geofence' };
    }
  }
}
