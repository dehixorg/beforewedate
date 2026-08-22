import { Controller, Post, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { CoachService } from './coach.service';

@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post('ask')
  async askCoach(
    @Headers('x-user-id') userId: string,
    @Body() body: { match_id: string }
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    
    // Call the coach asynchronously so we don't block the HTTP response for too long
    // In a real app we'd queue this, but for v1 we can just fire and forget, returning a success immediately
    this.coachService.triggerManualIcebreaker(userId, body.match_id).catch(err => {
      console.error('Coach icebreaker failed:', err);
    });

    return { success: true, message: 'Coach is typing...' };
  }
}
