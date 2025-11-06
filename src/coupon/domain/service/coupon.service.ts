import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Coupon, CreateCouponDto } from '../entity/coupon.entity';
import {
  ICouponRepository,
  COUPON_REPOSITORY,
} from '../interface/coupon.repository.interface';

@Injectable()
export class CouponService {
  constructor(
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  // 쿠폰 생성 (Coupon 테이블만)
  async createCoupon(dto: CreateCouponDto): Promise<Coupon> {
    // Domain Entity 생성 (비즈니스 규칙 검증 포함)
    const coupon = Coupon.create({
      ...dto,
      id: randomUUID(),
    });

    // Repository를 통해 저장
    return this.couponRepository.create(coupon);
  }

  // 쿠폰 조회
  async findCouponById(id: string): Promise<Coupon | null> {
    return this.couponRepository.findById(id, {
      includeCategories: true,
      includeProducts: true,
    });
  }

  // 모든 쿠폰 조회
  async findAllCoupons(): Promise<Coupon[]> {
    return this.couponRepository.findAll({
      includeCategories: true,
      includeProducts: true,
    });
  }

  // 발급 가능한 쿠폰 조회
  async findAvailableCoupons(): Promise<Coupon[]> {
    return this.couponRepository.findAvailableCoupons();
  }

  // BR-038: 쿠폰 발급 가능 여부 확인
  async checkCanIssue(couponId: string): Promise<boolean> {
    const coupon = await this.couponRepository.findById(couponId);
    if (!coupon) {
      return false;
    }
    return coupon.canIssue();
  }

  // BR-038: 쿠폰 발급 수량 증가
  async increaseIssuedQuantity(couponId: string): Promise<void> {
    await this.couponRepository.increaseIssuedQuantity(couponId);
  }
}
