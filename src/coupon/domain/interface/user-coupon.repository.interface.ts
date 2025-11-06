import { CouponStatus } from '@prisma/client';
import { UserCoupon } from '../entity/user-coupon.entity';

export interface UserCouponFilterOptions {
  status?: CouponStatus;
  includeCoupon?: boolean;
}

export interface IUserCouponRepository {
  // ID로 UserCoupon 조회
  findById(
    id: string,
    options?: UserCouponFilterOptions,
  ): Promise<UserCoupon | null>;

  // 사용자의 쿠폰 목록 조회
  findByUserId(
    userId: string,
    options?: UserCouponFilterOptions,
  ): Promise<UserCoupon[]>;

  // 사용자가 특정 쿠폰을 보유하고 있는지 확인
  existsByUserIdAndCouponId(userId: string, couponId: string): Promise<boolean>;

  // 사용자가 사용 가능한 쿠폰 조회
  findAvailableCouponsByUserId(userId: string): Promise<UserCoupon[]>;

  // UserCoupon 생성
  create(userCoupon: UserCoupon): Promise<UserCoupon>;

  // UserCoupon 업데이트 (사용, 복구, 만료 처리)
  update(userCoupon: UserCoupon): Promise<UserCoupon>;

  // 만료된 쿠폰 조회
  findExpiredCoupons(): Promise<UserCoupon[]>;

  // 만료된 쿠폰 일괄 업데이트
  expireCoupons(userCouponIds: string[]): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const USER_COUPON_REPOSITORY = Symbol('USER_COUPON_REPOSITORY');
