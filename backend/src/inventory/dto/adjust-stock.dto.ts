import { IsInt, IsNotEmpty, IsOptional, Min, MaxLength } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  change: number; // positive or negative

  @IsOptional()
  @MaxLength(255)
  reason?: string;
}
