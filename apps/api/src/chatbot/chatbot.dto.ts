import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ description: 'User message to the chatbot', example: 'What is RippledApp?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;
}

export class ChatReplyDto {
  @ApiProperty({ description: 'Chatbot reply', example: 'RippledApp is a next-generation crowdfunding platform...' })
  reply!: string;
}
