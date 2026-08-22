import { Controller, Post, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { DarkRoomService } from './dark_room.service';

@Controller('dark-room')
export class DarkRoomController {
  constructor(private readonly drService: DarkRoomService) {}

  @Post('start')
  async startSession(
    @Headers('x-user-id') userId: string,
    @Body('relationship_id') relId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.drService.startSession(relId, userId);
  }

  @Post(':id/message')
  async sendMessage(
    @Param('id') sessionId: string,
    @Headers('x-user-id') userId: string,
    @Body('text') text: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.drService.handleMessage(sessionId, userId, text);
  }

  @Post(':id/propose-summary')
  async proposeSummary(
    @Param('id') sessionId: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.drService.proposeSummary(sessionId, userId);
  }

  @Post(':id/consent')
  async consentSummary(
    @Param('id') sessionId: string,
    @Headers('x-user-id') userId: string,
    @Body('approve') approve: boolean,
    @Body('summary') summary: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.drService.handleConsent(sessionId, userId, approve, summary);
  }
}
