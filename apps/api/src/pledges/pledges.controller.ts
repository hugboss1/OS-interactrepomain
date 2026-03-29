import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PledgesService } from './pledges.service';
import { CreatePledgeDto } from './dto/create-pledge.dto';

@ApiTags('pledges')
@Controller({ path: 'projects/:projectId/pledges', version: '1' })
export class PledgesController {
  constructor(private readonly pledgesService: PledgesService) {}

  @Get()
  @ApiOperation({ summary: 'List pledges for a project (public aggregate)' })
  list(@Param('projectId') projectId: string) {
    return this.pledgesService.listByProject(projectId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a pledge (initiates Stripe PaymentIntent)' })
  create(
    @Param('projectId') projectId: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: CreatePledgeDto,
  ) {
    return this.pledgesService.create(projectId, req.user.userId, dto.amount);
  }
}
