import {
  IsString,
  IsUUID,
  IsInt,
  IsPositive,
  IsArray,
  ArrayMinSize,
  IsOptional,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString({ message: '상품 ID는 문자열이어야 합니다.' })
  @IsUUID('4', { message: '올바른 상품 ID 형식이 아닙니다.' })
  productId: string;

  @IsInt({ message: '수량은 정수여야 합니다.' })
  @IsPositive({ message: '수량은 1 이상이어야 합니다.' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray({ message: '상품 목록은 배열이어야 합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ArrayMinSize(1, { message: '최소 1개 이상의 상품을 선택해주세요.' })
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsArray({ message: '쿠폰 ID 목록은 배열이어야 합니다.' })
  @IsUUID('4', { each: true, message: '올바른 쿠폰 ID 형식이 아닙니다.' })
  couponIds?: string[];

  @IsOptional()
  @IsString({ message: '배송 요청사항은 문자열이어야 합니다.' })
  @MaxLength(500, {
    message: '배송 요청사항은 최대 500자까지 입력 가능합니다.',
  })
  deliveryRequest?: string;
}
