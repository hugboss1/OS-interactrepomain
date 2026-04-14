import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('waitlist')
  @ApiOperation({ summary: 'List all waitlist entries (admin only)' })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listWaitlist(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listWaitlist({
      sortBy,
      sortOrder,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('waitlist/export')
  @ApiOperation({ summary: 'Export waitlist as CSV (admin only)' })
  async exportCsv(@Res() res: FastifyReply) {
    const csv = await this.adminService.exportCsv();
    void res
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename="waitlist.csv"')
      .send(csv);
  }

  @Post('waitlist/:id/ban')
  @ApiOperation({ summary: 'Ban a waitlist entry (admin only)' })
  ban(@Param('id') id: string) {
    return this.adminService.banEntry(id);
  }

  @Post('waitlist/:id/unban')
  @ApiOperation({ summary: 'Unban a waitlist entry (admin only)' })
  unban(@Param('id') id: string) {
    return this.adminService.unbanEntry(id);
  }

  @Post('waitlist/:id/resend-confirmation')
  @ApiOperation({ summary: 'Resend confirmation email (admin only)' })
  resendConfirmation(@Param('id') id: string) {
    return this.adminService.resendConfirmation(id);
  }

  @Post('waitlist/:id/grant-genpoints')
  @ApiOperation({ summary: 'Grant genpoints to a waitlist entry (admin only)' })
  grantGenpoints(
    @Param('id') id: string,
    @Body() body: { amount: number },
  ) {
    return this.adminService.grantGenpoints(id, body.amount);
  }
}
