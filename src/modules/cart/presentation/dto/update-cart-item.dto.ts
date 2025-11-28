import { IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt({ message: '수량은 정수여야 합니다.' })
  @Min(1, { message: '수량은 1개 이상이어야 합니다.' })
  quantity: number;
}
