import { Module } from '@nestjs/common';
import { CouponAdminController } from '../presentation/controller/coupon-admin.controller';
import { CouponCustomerController } from '../presentation/controller/coupon-customer.controller';
import { CouponService } from '../domain/service/coupon.service';
import { UserCouponService } from '../domain/service/user-coupon.service';
import { CouponFacade } from '../application/coupon.facade';
import { COUPON_REPOSITORY } from '../domain/interface/coupon.repository.interface';
import { USER_COUPON_REPOSITORY } from '../domain/interface/user-coupon.repository.interface';
import { CouponRepository } from './coupon.repository';
import { UserCouponRepository } from './user-coupon.repository';

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
    // Domain Services
    CouponService,
    UserCouponService,
    // Application Facade
    CouponFacade,
  ],
  exports: [CouponFacade, CouponService, UserCouponService],
})
export class CouponModule {}
