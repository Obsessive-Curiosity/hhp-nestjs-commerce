import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProductCoupon as PrismaProductCoupon } from '@prisma/client';
import { ProductCoupon } from '../domain/entity/product-coupon.entity';
import { IProductCouponRepository } from '../domain/interface/product-coupon.repository.interface';

@Injectable()
export class ProductCouponRepository implements IProductCouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaProductCoupon): ProductCoupon {
    return new ProductCoupon({
      couponId: row.couponId,
      productId: row.productId,
    });
  }

  async create(couponId: string, productId: string): Promise<ProductCoupon> {
    const createdProductCoupon = await this.prisma.productCoupon.create({
      data: {
        couponId,
        productId,
      },
    });

    return this.toDomain(createdProductCoupon);
  }

  async findByProductId(productId: string): Promise<string[]> {
    const now = new Date();

    const productCoupons = await this.prisma.productCoupon.findMany({
      where: {
        productId,
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
    return productCoupons
      .filter(
        (pc) =>
          pc.coupon.totalQuantity === null ||
          pc.coupon.issuedQuantity < pc.coupon.totalQuantity,
      )
      .map((pc) => pc.couponId);
  }
}
