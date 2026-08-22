import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AzureModule } from '../azure/azure.module';
import { CoachModule } from '../coach/coach.module';

@Module({
  imports: [AzureModule, CoachModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
