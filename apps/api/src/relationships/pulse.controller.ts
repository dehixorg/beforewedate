import { Controller, Post, Get, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { PulseService } from './pulse.service';

@Controller('relationships/:id/pulse')
export class PulseController {
  constructor(private readonly pulseService: PulseService) {}

  @Post()
  async logPulse(
    @Param('id') relId: string,
    @Headers('x-user-id') userId: string,
    @Body('score') score: number,
    @Body('note') note: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.pulseService.logPulse(relId, userId, score, note);
  }

  @Get('insight')
  async getInsight(
    @Param('id') relId: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.pulseService.generateInsight(relId, userId);
  }
}
