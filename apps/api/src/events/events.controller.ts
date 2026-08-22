import { Controller, Post, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post(':id/rsvp')
  async rsvp(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string,
    @Body('status') status: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    const validStatus = status === 'cancelled' ? 'cancelled' : 'attending';
    return this.eventsService.rsvpToEvent(eventId, userId, validStatus);
  }

  @Post(':id/checkin')
  async checkIn(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    if (lat === undefined || lng === undefined) {
      throw new HttpException('Missing coordinates', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const result = await this.eventsService.checkIn(eventId, userId, lat, lng);
      return { success: result };
    } catch (e: any) {
      throw new HttpException(e.message || 'Check-in failed', HttpStatus.BAD_REQUEST);
    }
  }
}
