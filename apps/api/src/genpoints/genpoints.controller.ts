import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenpointsService } from './genpoints.service';

@ApiTags('genpoints')
@Controller({ path: 'me/genpoints', version: '1' })
export class GenpointsController {
  constructor(private readonly genpointsService: GenpointsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user genpoints balance and history' })
  getMyGenpoints(@Request() req: { user: { userId: string } }) {
    return this.genpointsService.getForUser(req.user.userId);
  }
}
