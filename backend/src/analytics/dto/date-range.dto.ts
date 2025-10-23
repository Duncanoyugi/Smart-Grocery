// src/analytics/dto/date-range.dto.ts
import { IsOptional, IsString, IsIn } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsString()
  from?: string; // ISO date string (yyyy-mm-dd or full ISO)

  @IsOptional()
  @IsString()
  to?: string;   // ISO date string

  @IsOptional()
  @IsIn(['day', 'month'])
  groupBy?: 'day' | 'month';
}
