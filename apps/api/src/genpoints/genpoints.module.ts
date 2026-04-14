import { Module } from '@nestjs/common';
import { GenpointsController } from './genpoints.controller';
import { GenpointsService } from './genpoints.service';

@Module({
  controllers: [GenpointsController],
  providers: [GenpointsService],
  exports: [GenpointsService],
})
export class GenpointsModule {}
