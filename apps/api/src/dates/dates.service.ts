import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatesService {
  private supabaseAdmin;
  private readonly logger = new Logger(DatesService.name);

  constructor(private readonly configService: ConfigService) {
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
  }

  async getVenues() {
    const { data, error } = await this.supabaseAdmin
      .from('venues')
      .select('*')
      .eq('offers_dates', true);

    if (error) {
      this.logger.error('Failed to fetch date venues', error);
      throw new HttpException('Failed to fetch venues', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return data;
  }

  async getBookings(relId: string, userId: string) {
    // 1. Verify user is in relationship
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('id')
      .eq('id', relId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single();

    if (!rel) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    const { data, error } = await this.supabaseAdmin
      .from('date_bookings')
      .select('*, venues(name, location)')
      .eq('relationship_id', relId)
      .order('booking_time', { ascending: true });

    if (error) throw new HttpException('Failed to fetch bookings', HttpStatus.INTERNAL_SERVER_ERROR);
    return data;
  }

  async createBooking(relId: string, userId: string, venueId: string, bookingTime: string) {
    // 1. Verify relationship
    const { data: rel } = await this.supabaseAdmin
      .from('relationships')
      .select('id')
      .eq('id', relId)
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .single();

    if (!rel) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    // 2. Insert booking
    const { data, error } = await this.supabaseAdmin
      .from('date_bookings')
      .insert({
        relationship_id: relId,
        venue_id: venueId,
        booking_time: bookingTime,
        status: 'confirmed',
        commission_amount: 10.00
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create booking', error);
      throw new HttpException('Failed to create booking', HttpStatus.BAD_REQUEST);
    }

    return data;
  }
}
