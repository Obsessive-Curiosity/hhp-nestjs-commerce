import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CouponService } from '../domain/service/coupon.service';
import { UserCouponService } from '../domain/service/user-coupon.service';
import { CouponStatus } from '../domain/entity/user-coupon.entity';
import { CreateOrderCouponDto } from '../presentation/dto';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { UserCouponResponseDto } from './dto/user-coupon-response.dto';

@Injectable()
export class CouponFacade {
  constructor(
    private readonly couponService: CouponService,
    private readonly userCouponService: UserCouponService,
  ) {}

  // 주문 쿠폰 생성 (관리자)
  async createOrderCoupon(dto: CreateOrderCouponDto) {
    const coupon = await this.couponService.createCoupon(dto);

    return CouponResponseDto.from(coupon);
  }

  // 쿠폰 목록 조회
  async getCoupons(availableOnly?: boolean) {
    const coupons = availableOnly
      ? await this.couponService.findAvailableCoupons()
      : await this.couponService.findAllCoupons();

    return coupons.map((coupon) => CouponResponseDto.from(coupon));
  }

  // 쿠폰 상세 조회
  async getCoupon(id: string) {
    const coupon = await this.couponService.findCouponById(id);
    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    return CouponResponseDto.from(coupon);
  }

  // BR-027, BR-038, BR-039: 쿠폰 발급
  async issueCoupon(userId: string, couponId: string) {
    // 쿠폰 조회
    const coupon = await this.couponService.findCouponById(couponId);
    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    // BR-038: 발급 가능 여부 확인
    if (!coupon.canIssue()) {
      throw new BadRequestException('발급할 수 없는 쿠폰입니다.');
    }

    // BR-039: 중복 발급 확인
    const alreadyIssued = await this.userCouponService.checkDuplicateIssue(
      userId,
      couponId,
    );
    if (alreadyIssued) {
      throw new BadRequestException('이미 발급받은 쿠폰입니다.');
    }

    // UserCoupon 발급
    const userCoupon = await this.userCouponService.issueCoupon(userId, coupon);

    // 쿠폰 발급 수량 증가
    await this.couponService.increaseIssuedQuantity(couponId);

    // 발급된 쿠폰 정보 반환
    return UserCouponResponseDto.fromWithoutCanUse(userCoupon);
  }

  // 내 쿠폰 목록 조회
  async getUserCoupons(userId: string, status?: CouponStatus) {
    const userCoupons = await this.userCouponService.findUserCoupons(
      userId,
      status,
    );

    // 내 쿠폰 목록 반환 (사용, 미사용 구분)
    return userCoupons.map((userCoupon) =>
      UserCouponResponseDto.from(userCoupon),
    );
  }

  // 사용 가능한 쿠폰 조회
  async getAvailableCoupons(userId: string) {
    const userCoupons =
      await this.userCouponService.findAvailableCoupons(userId);

    // 사용 가능한 쿠폰 목록 반환
    return userCoupons.map((userCoupon) =>
      UserCouponResponseDto.fromWithoutCanUse(userCoupon),
    );
  }
}
