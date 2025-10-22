import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class AddCartDto {
  @IsInt()
  @IsNotEmpty()
  product_id: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
