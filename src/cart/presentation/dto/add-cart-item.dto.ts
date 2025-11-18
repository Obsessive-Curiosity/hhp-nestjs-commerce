import { IsString, IsUUID, IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @IsString({ message: '상품 ID는 문자열이어야 합니다.' })
  @IsUUID('4', { message: '올바른 상품 ID 형식이 아닙니다.' })
  productId: string;

  @IsInt({ message: '수량은 정수여야 합니다.' })
  @Min(1, { message: '수량은 1개 이상이어야 합니다.' })
  quantity: number;
}
