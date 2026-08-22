import { Controller, Post, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('subscribe')
  async subscribe(@Headers('x-user-id') userId: string) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.paymentsService.subscribe(userId);
  }

  @Post('purchase')
  async purchase(
    @Headers('x-user-id') userId: string,
    @Body('item_type') itemType: 'extend_match' | 'compliment',
    @Body('match_id') matchId?: string,
    @Body('target_user_id') targetUserId?: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.paymentsService.purchaseItem(userId, itemType, matchId, targetUserId);
  }
}
