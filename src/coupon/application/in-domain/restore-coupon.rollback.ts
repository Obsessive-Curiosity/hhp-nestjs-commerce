import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/core';
import { UserCouponService } from '@/coupon/domain/service/user-coupon.service';

export interface RestoreCouponParams {
  userCouponId: string;
}

@Injectable()
export class RestoreCouponRollback {
  constructor(private readonly userCouponService: UserCouponService) {}

  @Transactional()
  async execute(params: RestoreCouponParams): Promise<void> {
    const { userCouponId } = params;

    // 쿠폰 복구 (상태: USED → ISSUED)
    await this.userCouponService.restoreCoupon(userCouponId);
  }
}
