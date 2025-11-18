import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@/user/domain/entity/user.entity';
import { CouponFacade } from '@/coupon/application/coupon.facade';
import { CreateOrderCouponDto } from '../dto';

@RBAC([Role.ADMIN])
@Controller('/admin/coupon')
export class CouponAdminController {
  constructor(private readonly couponFacade: CouponFacade) {}

  // 쿠폰 생성
  @Post()
  createCoupon(@Body() createOrderCouponDto: CreateOrderCouponDto) {
    return this.couponFacade.createOrderCoupon(createOrderCouponDto);
  }

  // 모든 쿠폰 조회 (관리자)
  @Get()
  getAllCoupons() {
    return this.couponFacade.getCoupons(false);
  }

  // 쿠폰 상세 조회
  @Get(':id')
  getCoupon(@Param('id') id: string) {
    return this.couponFacade.getCoupon(id);
  }
}
