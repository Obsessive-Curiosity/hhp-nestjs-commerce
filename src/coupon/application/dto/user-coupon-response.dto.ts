import {
  UserCoupon,
  CouponStatus,
} from '../../domain/entity/user-coupon.entity';

export class UserCouponResponseDto {
  id: string;
  couponId: string;
  status: CouponStatus;
  createdAt: Date;
  expiredAt: Date;
  usedAt: Date | null;
  canUse?: boolean;

  static from(userCoupon: UserCoupon): UserCouponResponseDto {
    const dto = new UserCouponResponseDto();
    dto.id = userCoupon.id;
    dto.couponId = userCoupon.couponId;
    dto.status = userCoupon.status;
    dto.createdAt = userCoupon.createdAt;
    dto.expiredAt = userCoupon.expiredAt;
    dto.usedAt = userCoupon.usedAt;
    dto.canUse = userCoupon.canUse();
    return dto;
  }

  static fromWithoutCanUse(userCoupon: UserCoupon): UserCouponResponseDto {
    const dto = new UserCouponResponseDto();
    dto.id = userCoupon.id;
    dto.couponId = userCoupon.couponId;
    dto.status = userCoupon.status;
    dto.createdAt = userCoupon.createdAt;
    dto.expiredAt = userCoupon.expiredAt;
    dto.usedAt = userCoupon.usedAt;
    return dto;
  }
}
