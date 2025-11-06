import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CouponService } from '../domain/service/coupon.service';
import { CategoryCouponService } from '../domain/service/category-coupon.service';
import { ProductCouponService } from '../domain/service/product-coupon.service';
import { UserCouponService } from '../domain/service/user-coupon.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CouponScope, CouponStatus, CouponType } from '@prisma/client';
import {
  CreateOrderCouponDto,
  CreateCategoryCouponDto,
  CreateProductCouponDto,
} from '../presentation/dto';

@Injectable()
export class CouponFacadeService {
  constructor(
    private readonly couponService: CouponService,
    private readonly categoryCouponService: CategoryCouponService,
    private readonly productCouponService: ProductCouponService,
    private readonly userCouponService: UserCouponService,
    private readonly prisma: PrismaService,
  ) {}

  // 주문 쿠폰 생성 (관리자)
  async createOrderCoupon(dto: CreateOrderCouponDto) {
    // Coupon 생성
    const coupon = await this.couponService.createCoupon({
      name: dto.name,
      type: dto.type,
      scope: CouponScope.ORDER,
      discountAmount: dto.discountAmount ?? null,
      discountRate: dto.discountRate ?? null,
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      minPurchaseAmount: dto.minPurchaseAmount ?? null,
      startAt: dto.startAt,
      endAt: dto.endAt ?? null,
      validityDays: dto.validityDays ?? null,
      totalQuantity: dto.totalQuantity ?? null,
    });

    return coupon;
  }

  // 카테고리 쿠폰 생성 (관리자)
  async createCategoryCoupon(dto: CreateCategoryCouponDto) {
    return this.prisma.$transaction(async () => {
      // 1. Coupon 생성
      const coupon = await this.couponService.createCoupon({
        name: dto.name,
        type: CouponType.RATE,
        scope: CouponScope.CATEGORY,
        discountAmount: null,
        discountRate: dto.discountRate,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        minPurchaseAmount: dto.minPurchaseAmount ?? null,
        startAt: dto.startAt,
        endAt: dto.endAt ?? null,
        validityDays: dto.validityDays ?? null,
        totalQuantity: dto.totalQuantity ?? null,
      });

      // 2. CategoryCoupon 중간 테이블 추가
      await this.categoryCouponService.createCategoryCoupon(
        coupon.id,
        dto.categoryId,
      );

      return coupon;
    });
  }

  // 상품 쿠폰 생성 (관리자)
  async createProductCoupon(dto: CreateProductCouponDto) {
    return this.prisma.$transaction(async () => {
      // 1. Coupon 생성
      const coupon = await this.couponService.createCoupon({
        name: dto.name,
        type: CouponType.RATE,
        scope: CouponScope.PRODUCT,
        discountAmount: null,
        discountRate: dto.discountRate,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        minPurchaseAmount: dto.minPurchaseAmount ?? null,
        startAt: dto.startAt,
        endAt: dto.endAt ?? null,
        validityDays: dto.validityDays ?? null,
        totalQuantity: dto.totalQuantity ?? null,
      });

      // 2. ProductCoupon 중간 테이블 추가
      await this.productCouponService.createProductCoupon(
        coupon.id,
        dto.productId,
      );

      return coupon;
    });
  }

  // 쿠폰 목록 조회
  async getCoupons(availableOnly?: boolean) {
    const coupons = availableOnly
      ? await this.couponService.findAvailableCoupons()
      : await this.couponService.findAllCoupons();

    return coupons.map((coupon) => ({
      id: coupon.id,
      name: coupon.name,
      type: coupon.type,
      scope: coupon.scope,
      discountAmount: coupon.discountAmount,
      discountRate: coupon.discountRate,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minPurchaseAmount: coupon.minPurchaseAmount,
      startAt: coupon.startAt,
      endAt: coupon.endAt,
      validityDays: coupon.validityDays,
      totalQuantity: coupon.totalQuantity,
      issuedQuantity: coupon.issuedQuantity,
      isUnlimited: coupon.totalQuantity === null, // 무제한 여부
      remainingQuantity:
        coupon.totalQuantity !== null
          ? coupon.totalQuantity - coupon.issuedQuantity
          : null, // 무제한이면 null
      canIssue: coupon.canIssue(),
    }));
  }

  // 쿠폰 상세 조회
  async getCoupon(id: string) {
    const coupon = await this.couponService.findCouponById(id);
    if (!coupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    return {
      id: coupon.id,
      name: coupon.name,
      type: coupon.type,
      scope: coupon.scope,
      discountAmount: coupon.discountAmount,
      discountRate: coupon.discountRate,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minPurchaseAmount: coupon.minPurchaseAmount,
      startAt: coupon.startAt,
      endAt: coupon.endAt,
      validityDays: coupon.validityDays,
      totalQuantity: coupon.totalQuantity,
      issuedQuantity: coupon.issuedQuantity,
      isUnlimited: coupon.totalQuantity === null, // 무제한 여부
      remainingQuantity:
        coupon.totalQuantity !== null
          ? coupon.totalQuantity - coupon.issuedQuantity
          : null, // 무제한이면 null
      canIssue: coupon.canIssue(),
    };
  }

  // BR-027, BR-038, BR-039: 쿠폰 발급
  async issueCoupon(userId: string, couponId: string) {
    return this.prisma.$transaction(async () => {
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
      const userCoupon = await this.userCouponService.issueCoupon(
        userId,
        coupon,
      );

      // 쿠폰 발급 수량 증가
      await this.couponService.increaseIssuedQuantity(couponId);

      return {
        id: userCoupon.id,
        couponId: userCoupon.couponId,
        status: userCoupon.status,
        expiredAt: userCoupon.expiredAt,
        createdAt: userCoupon.createdAt,
      };
    });
  }

  // 내 쿠폰 목록 조회
  async getUserCoupons(userId: string, status?: CouponStatus) {
    const userCoupons = await this.userCouponService.findUserCoupons(
      userId,
      status,
    );

    return userCoupons.map((uc) => ({
      id: uc.id,
      couponId: uc.couponId,
      status: uc.status,
      createdAt: uc.createdAt,
      expiredAt: uc.expiredAt,
      usedAt: uc.usedAt,
      coupon: uc.coupon,
      canUse: uc.canUse(),
    }));
  }

  // 사용 가능한 쿠폰 조회
  async getAvailableCoupons(userId: string) {
    const userCoupons =
      await this.userCouponService.findAvailableCoupons(userId);

    return userCoupons.map((uc) => ({
      id: uc.id,
      couponId: uc.couponId,
      status: uc.status,
      expiredAt: uc.expiredAt,
      coupon: uc.coupon,
    }));
  }
}
