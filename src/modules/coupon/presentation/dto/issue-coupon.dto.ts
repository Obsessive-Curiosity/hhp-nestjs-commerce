import { IsString, IsUUID } from 'class-validator';

export class IssueCouponDto {
  @IsString({ message: '쿠폰 ID는 문자열이어야 합니다.' })
  @IsUUID('4', { message: '유효한 쿠폰 ID가 아닙니다.' })
  couponId: string;
}
