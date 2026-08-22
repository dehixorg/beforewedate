import { Module } from '@nestjs/common';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { AzureModule } from '../azure/azure.module';
import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';
import { DarkRoomController } from './dark_room.controller';
import { DarkRoomService } from './dark_room.service';

@Module({
  imports: [AzureModule],
  controllers: [CoachController, MemoryController, DarkRoomController],
  providers: [CoachService, MemoryService, DarkRoomService],
  exports: [CoachService, MemoryService, DarkRoomService],
})
export class CoachModule {}
