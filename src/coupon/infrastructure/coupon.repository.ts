import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Coupon as PrismaCoupon } from '@prisma/client';
import { Coupon } from '../domain/entity/coupon.entity';
import {
  ICouponRepository,
  CouponFilterOptions,
} from '../domain/interface/coupon.repository.interface';

@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaCoupon): Coupon {
    return new Coupon({
      id: row.id,
      name: row.name,
      type: row.type,
      scope: row.scope,
      discountAmount: row.discountAmount,
      discountRate: row.discountRate,
      maxDiscountAmount: row.maxDiscountAmount,
      minPurchaseAmount: row.minPurchaseAmount ?? null,
      startAt: row.startAt,
      endAt: row.endAt,
      validityDays: row.validityDays,
      totalQuantity: row.totalQuantity,
      issuedQuantity: row.issuedQuantity,
      createdAt: row.createdAt,
    });
  }

  // write: Entity → DB
  private fromDomain(coupon: Coupon) {
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
      createdAt: coupon.createdAt,
    };
  }

  // Include 옵션을 Prisma include로 변환
  private buildIncludeOptions(options?: CouponFilterOptions) {
    if (!options) return undefined;

    return {
      categories: options.includeCategories
        ? {
            include: {
              category: true,
            },
          }
        : false,
      products: options.includeProducts
        ? {
            include: {
              product: true,
            },
          }
        : false,
    };
  }

  async findById(
    id: string,
    options?: CouponFilterOptions,
  ): Promise<Coupon | null> {
    const couponData = await this.prisma.coupon.findUnique({
      where: { id },
      include: this.buildIncludeOptions(options),
    });

    return couponData ? this.toDomain(couponData) : null;
  }

  async findAll(options?: CouponFilterOptions): Promise<Coupon[]> {
    const now = new Date();

    let coupons: PrismaCoupon[];

    if (options?.availableOnly) {
      const allCoupons = await this.prisma.coupon.findMany({
        where: {
          startAt: { lte: now },
          OR: [{ endAt: { gte: now } }, { endAt: null }],
        },
        include: this.buildIncludeOptions(options),
        orderBy: { createdAt: 'desc' },
      });

      // 발급 가능한 쿠폰만 필터링
      coupons = allCoupons.filter(
        (c) => c.totalQuantity === null || c.issuedQuantity < c.totalQuantity,
      );
    } else {
      coupons = await this.prisma.coupon.findMany({
        include: this.buildIncludeOptions(options),
        orderBy: { createdAt: 'desc' },
      });
    }

    return coupons.map((c) => this.toDomain(c));
  }

  async findAvailableCoupons(): Promise<Coupon[]> {
    const now = new Date();
    const coupons = await this.prisma.coupon.findMany({
      where: {
        startAt: { lte: now },
        OR: [{ endAt: { gte: now } }, { endAt: null }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // 발급 가능한 쿠폰만 필터링
    return coupons
      .filter(
        (c) => c.totalQuantity === null || c.issuedQuantity < c.totalQuantity,
      )
      .map((c) => this.toDomain(c));
  }

  async create(coupon: Coupon): Promise<Coupon> {
    const data = this.fromDomain(coupon);

    const createdCoupon = await this.prisma.coupon.create({
      data,
    });

    return this.toDomain(createdCoupon);
  }

  async update(coupon: Coupon): Promise<Coupon> {
    const data = this.fromDomain(coupon);

    const updatedCoupon = await this.prisma.coupon.update({
      where: { id: coupon.id },
      data,
    });

    return this.toDomain(updatedCoupon);
  }

  async increaseIssuedQuantity(couponId: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        issuedQuantity: { increment: 1 },
      },
    });
  }
}
