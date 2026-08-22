import { Controller, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { TrustScoreService } from './trust-score.service';

@Controller('users')
export class TrustScoreController {
  constructor(private readonly trustScoreService: TrustScoreService) {}

  @Post(':id/trust-score/recalculate')
  async recalculate(@Param('id') userId: string) {
    try {
      const result = await this.trustScoreService.recalculateUserScore(userId);
      return result;
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
