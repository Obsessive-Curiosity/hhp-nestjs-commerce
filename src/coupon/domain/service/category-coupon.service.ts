import { Inject, Injectable } from '@nestjs/common';
import {
  ICategoryCouponRepository,
  CATEGORY_COUPON_REPOSITORY,
} from '../interface/category-coupon.repository.interface';

@Injectable()
export class CategoryCouponService {
  constructor(
    @Inject(CATEGORY_COUPON_REPOSITORY)
    private readonly categoryCouponRepository: ICategoryCouponRepository,
  ) {}

  // 카테고리 쿠폰 생성
  async createCategoryCoupon(
    couponId: string,
    categoryId: number,
  ): Promise<void> {
    await this.categoryCouponRepository.create(couponId, categoryId);
  }

  // 특정 카테고리에 적용 가능한 쿠폰 조회 (유효기간 및 발급 가능 수량 체크 포함)
  findCouponsByCategoryId(categoryId: number): Promise<string[]> {
    return this.categoryCouponRepository.findByCategoryId(categoryId);
  }
}
