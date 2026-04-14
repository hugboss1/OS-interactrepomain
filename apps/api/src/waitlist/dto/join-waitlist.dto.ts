import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';

export class JoinWaitlistDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'abc123' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  referralCode?: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile token' })
  @IsOptional()
  @IsString()
  cfTurnstileToken?: string;

  @ApiHideProperty()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string; // Honeypot — hidden field, bots fill it, humans don't
}
