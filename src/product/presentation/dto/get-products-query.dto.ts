import { IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class GetProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onlyInStock?: boolean;
}
