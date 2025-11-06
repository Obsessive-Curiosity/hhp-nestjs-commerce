import { Coupon } from '../entity/coupon.entity';

export interface CouponFilterOptions {
  availableOnly?: boolean; // 발급 가능한 쿠폰만
  includeCategories?: boolean;
  includeProducts?: boolean;
}

export interface ICouponRepository {
  // ID로 쿠폰 조회
  findById(id: string, options?: CouponFilterOptions): Promise<Coupon | null>;

  // 모든 쿠폰 조회
  findAll(options?: CouponFilterOptions): Promise<Coupon[]>;

  // 발급 가능한 쿠폰 조회
  findAvailableCoupons(): Promise<Coupon[]>;

  // 쿠폰 생성 (Coupon 테이블만)
  create(coupon: Coupon): Promise<Coupon>;

  // 쿠폰 업데이트 (발급 수량 증가 등)
  update(coupon: Coupon): Promise<Coupon>;

  // 쿠폰 발급 수량 증가 (트랜잭션)
  increaseIssuedQuantity(couponId: string): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const COUPON_REPOSITORY = Symbol('COUPON_REPOSITORY');
