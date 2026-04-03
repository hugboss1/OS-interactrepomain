import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';

@ApiTags('waitlist')
@Controller({ path: 'waitlist', version: '1' })
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @ApiOperation({ summary: 'Join the waitlist (optionally with a referral code)' })
  join(@Body() dto: JoinWaitlistDto) {
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
