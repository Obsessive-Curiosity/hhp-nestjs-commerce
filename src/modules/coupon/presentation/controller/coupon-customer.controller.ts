import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserInfo } from '@/modules/user/presentation/decorators/user-info.decorator';
import { RBAC } from '@/modules/auth/decorators/rbac.decorator';
import { CouponStatus } from '@/modules/coupon/domain/entity/user-coupon.entity';
import { Role } from '@/modules/user/domain/entity/user.entity';
import { Payload } from '@/common/types/express';
import { CouponFacade } from '@/modules/coupon/application/coupon.facade';

@RBAC([Role.RETAILER])
@Controller('coupon')
export class CouponCustomerController {
  constructor(private readonly couponFacade: CouponFacade) {}

  // 발급 가능한 쿠폰 목록 조회
  @Get()
  getAvailableCoupons() {
    return this.couponFacade.getCoupons(true);
  }

  // 쿠폰 발급
  @Post(':couponId/issue')
  issueCoupon(@Param('couponId') couponId: string, @UserInfo() user: Payload) {
    return this.couponFacade.issueCoupon(user.sub, couponId);
  }

  // 내 쿠폰 목록 조회
  @Get('my')
  getMyCoupons(
    @UserInfo() user: Payload,
    @Query('status') status?: CouponStatus,
  ) {
    return this.couponFacade.getUserCoupons(user.sub, status);
  }

  // 사용 가능한 내 쿠폰 목록 조회
  @Get('my/available')
  getMyAvailableCoupons(@UserInfo() user: Payload) {
    return this.couponFacade.getAvailableCoupons(user.sub);
  }
}
