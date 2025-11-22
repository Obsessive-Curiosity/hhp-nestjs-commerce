import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Min } from 'class-validator';

export class CreatePromotionItemDto {
  @IsInt({ message: '유료 수량은 정수여야 합니다.' })
  @Min(1, { message: '유료 수량은 1 이상이어야 합니다.' })
  paidQuantity: number;

  @IsInt({ message: '무료 수량은 정수여야 합니다.' })
  @Min(1, { message: '무료 수량은 1 이상이어야 합니다.' })
  freeQuantity: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '유효한 날짜 형식이어야 합니다. (예: 2025-11-05)' })
  startAt?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '유효한 날짜 형식이어야 합니다. (예: 2025-12-31)' })
  endAt?: Date | null;
}

// 배열 타입으로 export
export type CreatePromotionsDto = CreatePromotionItemDto[];
