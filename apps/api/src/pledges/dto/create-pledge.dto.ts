import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePledgeDto {
  @ApiProperty({ description: 'Pledge amount in cents', minimum: 100 })
  @IsNumber()
  @Min(100)
  amount: number;
}
