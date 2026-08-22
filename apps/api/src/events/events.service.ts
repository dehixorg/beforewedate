import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EventsService {
  private supabaseAdmin;
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async rsvpToEvent(eventId: string, userId: string, status: string) {
    const { data, error } = await this.supabaseAdmin
      .from('event_rsvps')
      .upsert(
        { event_id: eventId, user_id: userId, status },
        { onConflict: 'event_id,user_id' }
      )
      .select()
      .single();

    if (error) {
      this.logger.error('RSVP Error', error);
      throw new Error('Failed to record RSVP');
    }

    return data;
  }

  async checkIn(eventId: string, userId: string, lat: number, lng: number) {
    // Call the PostGIS RPC that verifies distance
    const { data, error } = await this.supabaseAdmin.rpc('checkin_to_event', {
      target_event_id: eventId,
      lat,
      lng
    });

    if (error) {
      this.logger.error('Checkin RPC Error', error);
      throw new Error(error.message || 'Geofence validation failed');
    }

    return data; // Returns boolean true if successful
  }
}
