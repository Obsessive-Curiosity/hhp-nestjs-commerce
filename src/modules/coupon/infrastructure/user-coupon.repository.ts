import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { UserCoupon, CouponStatus } from '../domain/entity/user-coupon.entity';
import { IUserCouponRepository } from '../domain/interface/user-coupon.repository.interface';

@Injectable()
export class UserCouponRepository implements IUserCouponRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  async findById(id: string): Promise<UserCoupon | null> {
    return this.em.findOne(UserCoupon, { id });
  }

  async findByUserId(
    userId: string,
    status?: CouponStatus,
  ): Promise<UserCoupon[]> {
    const qb = this.em.qb(UserCoupon);

    qb.where({ userId });

    if (status) {
      qb.andWhere({ status });
    }

    qb.orderBy({ createdAt: 'DESC' });

    return await qb.getResultList();
  }

  async findAvailableCouponsByUserId(userId: string): Promise<UserCoupon[]> {
    return this.em.find(
      UserCoupon,
      {
        userId,
        status: CouponStatus.ISSUED,
        expiredAt: { $gte: new Date() },
      },
      { orderBy: { expiredAt: 'ASC' } },
    );
  }

  async hasCoupon(userId: string, couponId: string): Promise<boolean> {
    const count = await this.em.count(UserCoupon, { userId, couponId });
    return count > 0;
  }

  // ==================== 생성 (Create) ====================

  async create(userCoupon: UserCoupon): Promise<UserCoupon> {
    await this.em.persistAndFlush(userCoupon);
    return userCoupon;
  }

  // ==================== 수정 (Update) ====================

  async update(userCoupon: UserCoupon): Promise<UserCoupon> {
    await this.em.flush();
    return userCoupon;
  }

  // ==================== 배치 작업 (Batch) ====================

  async findExpiredCoupons(): Promise<UserCoupon[]> {
    return this.em.find(UserCoupon, {
      status: CouponStatus.ISSUED,
      expiredAt: { $lt: new Date() },
    });
  }

  async expireCoupons(userCouponIds: string[]): Promise<void> {
    await this.em.nativeUpdate(
      UserCoupon,
      { id: { $in: userCouponIds } },
      { status: CouponStatus.EXPIRED },
    );
  }
}
