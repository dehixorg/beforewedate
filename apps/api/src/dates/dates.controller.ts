import { Controller, Get, Post, Body, Headers, HttpException, HttpStatus, Param } from '@nestjs/common';
import { DatesService } from './dates.service';

@Controller('dates')
export class DatesController {
  constructor(private readonly datesService: DatesService) {}

  @Get('venues')
  async getVenues(@Headers('x-user-id') userId: string) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.datesService.getVenues();
  }

  @Get('bookings/:relationshipId')
  async getBookings(
    @Param('relationshipId') relId: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.datesService.getBookings(relId, userId);
  }

  @Post('bookings')
  async createBooking(
    @Headers('x-user-id') userId: string,
    @Body('relationship_id') relId: string,
    @Body('venue_id') venueId: string,
    @Body('booking_time') bookingTime: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.datesService.createBooking(relId, userId, venueId, bookingTime);
  }
}
