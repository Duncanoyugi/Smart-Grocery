import { IsString, IsNumber, IsOptional, IsDateString, Min, IsPositive } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString() // ✅ CHANGED: category is now required
  category: string;
}