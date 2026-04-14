import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { TurnstileGuard } from './guards/turnstile.guard';

@ApiTags('waitlist')
@Controller({ path: 'waitlist', version: '1' })
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @UseGuards(ThrottlerGuard, TurnstileGuard)
  @Throttle({ 'waitlist-ip': { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Join the waitlist (optionally with a referral code)' })
  @ApiResponse({ status: 429, description: 'Too many requests from this IP' })
  join(@Body() dto: JoinWaitlistDto) {
    if (dto.website) {
      // Honeypot field filled — silently reject bot
      return { position: 0, referralCode: 'ok', email: dto.email };
    }
    return this.waitlistService.join(dto);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Top referrers leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  leaderboard(@Query('limit') limit?: string) {
    return this.waitlistService.getLeaderboard(limit ? Number(limit) : 10);
  }

  @Get(':referralCode')
  @ApiOperation({ summary: 'Get waitlist entry by referral code' })
  getEntry(@Param('referralCode') referralCode: string) {
    return this.waitlistService.getEntry(referralCode);
  }
}
