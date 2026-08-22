import { Controller, Post, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Headers('x-user-id') userId: string,
    @Body() body: { match_id: string; text: string }
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    
    return this.chatService.sendMessage(userId, body.match_id, body.text);
  }

  @Post('report')
  async reportUser(
    @Headers('x-user-id') userId: string,
    @Body() body: { reported_id: string; match_id?: string; reason: string }
  ) {
    if (!userId) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    
    return this.chatService.reportUser(userId, body.reported_id, body.reason, body.match_id);
  }
}
