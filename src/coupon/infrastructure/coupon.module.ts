import { Module } from '@nestjs/common';
import { CouponAdminController } from '../presentation/controller/coupon-admin.controller';
import { CouponCustomerController } from '../presentation/controller/coupon-customer.controller';
import { CouponService } from '../domain/service/coupon.service';
import { CategoryCouponService } from '../domain/service/category-coupon.service';
import { ProductCouponService } from '../domain/service/product-coupon.service';
import { UserCouponService } from '../domain/service/user-coupon.service';
import { CouponFacadeService } from '../application/coupon.facade';
import { COUPON_REPOSITORY } from '../domain/interface/coupon.repository.interface';
import { USER_COUPON_REPOSITORY } from '../domain/interface/user-coupon.repository.interface';
import { CATEGORY_COUPON_REPOSITORY } from '../domain/interface/category-coupon.repository.interface';
import { PRODUCT_COUPON_REPOSITORY } from '../domain/interface/product-coupon.repository.interface';
import { CouponRepository } from './coupon.repository';
import { UserCouponRepository } from './user-coupon.repository';
import { CategoryCouponRepository } from './category-coupon.repository';
import { ProductCouponRepository } from './product-coupon.repository';

@Module({
  controllers: [CouponAdminController, CouponCustomerController],
  providers: [
    // Repository 의존성 주입
    {
      provide: COUPON_REPOSITORY,
      useClass: CouponRepository,
    },
    {
      provide: USER_COUPON_REPOSITORY,
      useClass: UserCouponRepository,
    },
    {
      provide: CATEGORY_COUPON_REPOSITORY,
      useClass: CategoryCouponRepository,
    },
    {
      provide: PRODUCT_COUPON_REPOSITORY,
      useClass: ProductCouponRepository,
    },
    // Domain Services
    CouponService,
    CategoryCouponService,
    ProductCouponService,
    UserCouponService,
    // Application Facade
    CouponFacadeService,
  ],
  exports: [
    CouponFacadeService,
    CouponService,
    CategoryCouponService,
    ProductCouponService,
    UserCouponService,
    CATEGORY_COUPON_REPOSITORY,
    PRODUCT_COUPON_REPOSITORY,
  ],
})
export class CouponModule {}
