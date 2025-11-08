import { CategoryCoupon } from '../entity/category-coupon.entity';

export interface ICategoryCouponRepository {
  // 카테고리 쿠폰 생성
  create(couponId: string, categoryId: number): Promise<CategoryCoupon>;

  // 특정 카테고리에 적용 가능한 쿠폰 조회
  findByCategoryId(categoryId: number): Promise<string[]>;
}

// Repository 의존성 주입을 위한 토큰
export const CATEGORY_COUPON_REPOSITORY = Symbol('CATEGORY_COUPON_REPOSITORY');
