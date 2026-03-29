import { IsString, IsNumber, IsDateString, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'Funding goal in cents' })
  @IsNumber()
  @Min(100)
  goalAmount: number;

  @ApiProperty()
  @IsDateString()
  deadline: string;

  @ApiProperty({ example: 'technology' })
  @IsString()
  category: string;
}
