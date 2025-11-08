import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CategoryCoupon as PrismaCategoryCoupon } from '@prisma/client';
import { CategoryCoupon } from '../domain/entity/category-coupon.entity';
import { ICategoryCouponRepository } from '../domain/interface/category-coupon.repository.interface';

@Injectable()
export class CategoryCouponRepository implements ICategoryCouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaCategoryCoupon): CategoryCoupon {
    return new CategoryCoupon({
      couponId: row.couponId,
      categoryId: row.categoryId,
    });
  }

  // write: Entity → DB
  private fromDomain(categoryCoupon: CategoryCoupon) {
    return {
      couponId: categoryCoupon.couponId,
      categoryId: categoryCoupon.categoryId,
    };
  }

  async create(couponId: string, categoryId: number): Promise<CategoryCoupon> {
    const createdCategoryCoupon = await this.prisma.categoryCoupon.create({
      data: {
        couponId,
        categoryId,
      },
    });

    return this.toDomain(createdCategoryCoupon);
  }

  async findByCategoryId(categoryId: number): Promise<string[]> {
    const now = new Date();

    const categoryCoupons = await this.prisma.categoryCoupon.findMany({
      where: {
        categoryId,
        coupon: {
          startAt: { lte: now },
          OR: [{ endAt: null }, { endAt: { gte: now } }],
        },
      },
      select: {
        couponId: true,
        coupon: {
          select: {
            issuedQuantity: true,
            totalQuantity: true,
          },
        },
      },
    });

    // 발급 가능한 쿠폰만 필터링
    return categoryCoupons
      .filter(
        (cc) =>
          cc.coupon.totalQuantity === null ||
          cc.coupon.issuedQuantity < cc.coupon.totalQuantity,
      )
      .map((cc) => cc.couponId);
  }
}
