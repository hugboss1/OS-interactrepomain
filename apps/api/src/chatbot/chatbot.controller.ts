import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto, ChatReplyDto } from './chatbot.dto';

@ApiTags('chatbot')
@Controller('chatbot')
@UseGuards(ThrottlerGuard)
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a message to the RippledApp chatbot' })
  @ApiResponse({ status: 200, description: 'Chatbot reply', type: ChatReplyDto })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async sendMessage(@Body() dto: ChatMessageDto): Promise<ChatReplyDto> {
    const reply = await this.chatbotService.getReply(dto.message);
    return { reply };
  }
}
