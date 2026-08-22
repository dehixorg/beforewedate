import { Controller, Post, Get, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('events/:id/discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Post('toggle')
  async toggleOptIn(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string,
    @Body('opt_in') optIn: boolean
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.discoveryService.toggleOptIn(eventId, userId, optIn);
  }

  @Get('candidates')
  async getCandidates(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.discoveryService.getCandidates(eventId, userId);
  }

  @Post('like')
  async likeCandidate(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string,
    @Body('to_user_id') toUserId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.discoveryService.likeCandidate(eventId, userId, toUserId);
  }

  @Post('heartbeat')
  async heartbeat(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string,
    @Body('lat') lat: number,
    @Body('lng') lng: number
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.discoveryService.processHeartbeat(eventId, userId, lat, lng);
  }
}
