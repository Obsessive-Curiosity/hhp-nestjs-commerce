import { Inject, Injectable } from '@nestjs/common';
import {
  IProductCouponRepository,
  PRODUCT_COUPON_REPOSITORY,
} from '../interface/product-coupon.repository.interface';

@Injectable()
export class ProductCouponService {
  constructor(
    @Inject(PRODUCT_COUPON_REPOSITORY)
    private readonly productCouponRepository: IProductCouponRepository,
  ) {}

  // 상품 쿠폰 생성
  async createProductCoupon(
    couponId: string,
    productId: string,
  ): Promise<void> {
    await this.productCouponRepository.create(couponId, productId);
  }

  // 특정 상품에 적용 가능한 쿠폰 조회 (유효기간 및 발급 가능 수량 체크 포함)
  async findCouponsByProductId(productId: string): Promise<string[]> {
    return this.productCouponRepository.findByProductId(productId);
  }
}
