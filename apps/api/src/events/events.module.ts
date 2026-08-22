import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  controllers: [EventsController, DiscoveryController],
  providers: [EventsService, DiscoveryService],
  exports: [EventsService, DiscoveryService],
})
export class EventsModule {}
