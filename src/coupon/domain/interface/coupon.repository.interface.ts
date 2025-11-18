import { Coupon } from '../entity/coupon.entity';

export interface ICouponRepository {
  // ==================== 조회 (Query) ====================

  // ID로 쿠폰 조회
  findById(id: string): Promise<Coupon | null>;

  // 모든 쿠폰 조회
  findAll(): Promise<Coupon[]>;

  // 발급 가능한 쿠폰 조회
  findAvailableCoupons(): Promise<Coupon[]>;

  // ==================== 생성 (Create) ====================

  // 쿠폰 생성
  create(coupon: Coupon): Promise<Coupon>;

  // ==================== 수정 (Update) ====================

  // 쿠폰 업데이트
  update(coupon: Coupon): Promise<Coupon>;

  // 쿠폰 발급 수량 증가 (원자적 연산)
  increaseIssuedQuantity(couponId: string): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');
