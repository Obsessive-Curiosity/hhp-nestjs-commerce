import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserCoupon as PrismaUserCoupon, CouponStatus } from '@prisma/client';
import { UserCoupon } from '../domain/entity/user-coupon.entity';
import {
  IUserCouponRepository,
  UserCouponFilterOptions,
} from '../domain/interface/user-coupon.repository.interface';
import { assignDirtyFields } from '@/common/utils/repository.utils';

@Injectable()
export class UserCouponRepository implements IUserCouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaUserCoupon): UserCoupon {
    return new UserCoupon({
      id: row.id,
      userId: row.userId,
      couponId: row.couponId,
      status: row.status,
      createdAt: row.createdAt,
      expiredAt: row.expiredAt,
      usedAt: row.usedAt,
    });
  }

  // write: Entity → DB
  private fromDomain(userCoupon: UserCoupon) {
    return {
      id: userCoupon.id,
      userId: userCoupon.userId,
      couponId: userCoupon.couponId,
      status: userCoupon.status,
      createdAt: userCoupon.createdAt,
      expiredAt: userCoupon.expiredAt,
      usedAt: userCoupon.usedAt,
    };
  }

  // Include 옵션을 Prisma include로 변환
  private buildIncludeOptions(options?: UserCouponFilterOptions) {
    if (!options) return undefined;

    return {
      coupon: options.includeCoupon ?? false,
    };
  }

  async findById(
    id: string,
    options?: UserCouponFilterOptions,
  ): Promise<UserCoupon | null> {
    const userCouponData = await this.prisma.userCoupon.findUnique({
      where: { id },
      include: this.buildIncludeOptions(options),
    });

    return userCouponData ? this.toDomain(userCouponData) : null;
  }

  async findByUserId(
    userId: string,
    options?: UserCouponFilterOptions,
  ): Promise<UserCoupon[]> {
    const where: { userId: string; status?: CouponStatus } = { userId };

    if (options?.status) {
      where.status = options.status;
    }

    const userCoupons = await this.prisma.userCoupon.findMany({
      where,
      include: this.buildIncludeOptions(options),
      orderBy: { createdAt: 'desc' },
    });

    return userCoupons.map((uc) => this.toDomain(uc));
  }

  async existsByUserIdAndCouponId(
    userId: string,
    couponId: string,
  ): Promise<boolean> {
    const count = await this.prisma.userCoupon.count({
      where: { userId, couponId },
    });

    return count > 0;
  }

  async findAvailableCouponsByUserId(userId: string): Promise<UserCoupon[]> {
    const now = new Date();
    const userCoupons = await this.prisma.userCoupon.findMany({
      where: {
        userId,
        status: CouponStatus.ISSUED,
        expiredAt: { gte: now },
      },
      include: {
        coupon: true,
      },
      orderBy: { expiredAt: 'asc' },
    });

    return userCoupons.map((uc) => this.toDomain(uc));
  }

  async create(userCoupon: UserCoupon): Promise<UserCoupon> {
    const data = this.fromDomain(userCoupon);

    const createdUserCoupon = await this.prisma.userCoupon.create({
      data,
    });

    return this.toDomain(createdUserCoupon);
  }

  async update(userCoupon: UserCoupon): Promise<UserCoupon> {
    const dirtyFields = userCoupon.getDirtyFields();
    const data = this.fromDomain(userCoupon);

    // 변경된 필드만 업데이트
    const updateData: Partial<typeof data> = {};
    assignDirtyFields(
      data,
      updateData,
      Array.from(dirtyFields) as (keyof typeof data)[],
    );

    const updatedUserCoupon = await this.prisma.userCoupon.update({
      where: { id: userCoupon.id },
      data: updateData,
    });

    userCoupon.clearDirtyFields();
    return this.toDomain(updatedUserCoupon);
  }

  async findExpiredCoupons(): Promise<UserCoupon[]> {
    const now = new Date();
    const userCoupons = await this.prisma.userCoupon.findMany({
      where: {
        status: CouponStatus.ISSUED,
        expiredAt: { lt: now },
      },
    });

    return userCoupons.map((uc) => this.toDomain(uc));
  }

  async expireCoupons(userCouponIds: string[]): Promise<void> {
    await this.prisma.userCoupon.updateMany({
      where: {
        id: { in: userCouponIds },
      },
      data: {
        status: CouponStatus.EXPIRED,
      },
    });
  }
}
