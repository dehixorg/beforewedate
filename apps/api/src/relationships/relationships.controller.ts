import { Controller, Post, Param, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';

@Controller('relationships')
export class RelationshipsController {
  constructor(private readonly relService: RelationshipsService) {}

  @Post(':id/action')
  async takeAction(
    @Param('id') relId: string,
    @Headers('x-user-id') userId: string,
    @Body('action') action: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    switch (action) {
      case 'pause':
        return this.relService.pause(relId, userId);
      case 'unpause':
        return this.relService.unpause(relId, userId);
      case 'end':
      case 'end_now':
        return this.relService.end(relId, userId);
      default:
        throw new HttpException('Invalid action', HttpStatus.BAD_REQUEST);
    }
  }
}

@Controller('matches')
export class MatchesController {
  constructor(private readonly relService: RelationshipsService) {}

  @Post(':id/go-official')
  async goOfficial(
    @Param('id') matchId: string,
    @Headers('x-user-id') userId: string
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    return this.relService.goOfficial(matchId, userId);
  }
}
