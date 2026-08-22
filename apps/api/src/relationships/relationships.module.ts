import { Module } from '@nestjs/common';
import { RelationshipsController, MatchesController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';
import { PulseController } from './pulse.controller';
import { PulseService } from './pulse.service';
import { AzureModule } from '../azure/azure.module';

@Module({
  imports: [AzureModule],
  controllers: [RelationshipsController, MatchesController, PulseController],
  providers: [RelationshipsService, PulseService],
  exports: [RelationshipsService, PulseService],
})
export class RelationshipsModule {}
