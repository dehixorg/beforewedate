import { Controller, Get, Query, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { RecommenderService } from './recommender.service';

@Controller('recommender')
export class RecommenderController {
  constructor(private readonly recommenderService: RecommenderService) {}

  @Get('deck')
  async getDeck(
    @Headers('x-user-id') userId: string,
    @Query('distance') distanceStr?: string,
  ) {
    if (!userId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const distance = distanceStr ? parseFloat(distanceStr) : 50000;

    try {
      const candidates = await this.recommenderService.getDeck(userId, distance);
      return candidates;
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
