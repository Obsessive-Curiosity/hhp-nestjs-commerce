import { UserCoupon, CouponStatus } from '../entity/user-coupon.entity';

export interface IUserCouponRepository {
  // ==================== 조회 (Query) ====================

  // ID로 UserCoupon 조회
  findById(id: string): Promise<UserCoupon | null>;

  // 사용자의 쿠폰 목록 조회 (상태별 필터링 가능)
  findByUserId(userId: string, status?: CouponStatus): Promise<UserCoupon[]>;

  // 사용자가 사용 가능한 쿠폰 조회
  findAvailableCouponsByUserId(userId: string): Promise<UserCoupon[]>;

  // 사용자가 특정 쿠폰을 보유하고 있는지 확인
  hasCoupon(userId: string, couponId: string): Promise<boolean>;

  // ==================== 생성 (Create) ====================

  // UserCoupon 생성
  create(userCoupon: UserCoupon): Promise<UserCoupon>;

  // ==================== 수정 (Update) ====================

  // UserCoupon 업데이트 (사용, 복구, 만료 처리)
  update(userCoupon: UserCoupon): Promise<UserCoupon>;

  // ==================== 배치 작업 (Batch) ====================

  // 만료된 쿠폰 조회 (시스템 전체)
  findExpiredCoupons(): Promise<UserCoupon[]>;

  // 만료된 쿠폰 일괄 업데이트
  expireCoupons(userCouponIds: string[]): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const USER_COUPON_REPOSITORY = Symbol('USER_COUPON_REPOSITORY');
