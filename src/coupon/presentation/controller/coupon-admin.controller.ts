import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@prisma/client';
import { CouponFacadeService } from '@/coupon/application/coupon.facade';
import {
  CreateOrderCouponDto,
  CreateCategoryCouponDto,
  CreateProductCouponDto,
} from '../dto';

@RBAC([Role.ADMIN])
@Controller('/admin/coupon')
export class CouponAdminController {
  constructor(private readonly couponFacade: CouponFacadeService) {}

  // 쿠폰 생성 - 범위: 주문
  @Post()
  createOrderCoupon(@Body() createOrderCouponDto: CreateOrderCouponDto) {
    return this.couponFacade.createOrderCoupon(createOrderCouponDto);
  }

  // 쿠폰 생성 - 범위: 카테고리
  @Post('category')
  createCategoryCoupon(
    @Body() createCategoryCouponDto: CreateCategoryCouponDto,
  ) {
    return this.couponFacade.createCategoryCoupon(createCategoryCouponDto);
  }

  // 쿠폰 생성 - 범위: 상품
  @Post('product')
  createProductCoupon(@Body() createProductCouponDto: CreateProductCouponDto) {
    return this.couponFacade.createProductCoupon(createProductCouponDto);
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
