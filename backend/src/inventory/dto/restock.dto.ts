import { IsInt, IsNotEmpty, Min, MaxLength } from 'class-validator';

export class RestockDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
