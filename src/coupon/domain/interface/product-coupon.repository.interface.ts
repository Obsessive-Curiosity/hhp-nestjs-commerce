import { ProductCoupon } from '../entity/product-coupon.entity';

export interface IProductCouponRepository {
  // 상품 쿠폰 생성
  create(couponId: string, productId: string): Promise<ProductCoupon>;

  // 특정 상품에 적용 가능한 쿠폰 조회
  findByProductId(productId: string): Promise<string[]>;
}

// Repository 의존성 주입을 위한 토큰
export const PRODUCT_COUPON_REPOSITORY = Symbol('PRODUCT_COUPON_REPOSITORY');
