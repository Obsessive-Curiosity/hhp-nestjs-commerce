import { Injectable } from '@nestjs/common';
import { EntityManager, raw } from '@mikro-orm/mysql';
import { Coupon } from '../domain/entity/coupon.entity';
import { ICouponRepository } from '../domain/interface/coupon.repository.interface';

@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // ID로 쿠폰 조회
  async findById(id: string): Promise<Coupon | null> {
    return this.em.findOne(Coupon, { id });
  }

  // 모든 쿠폰 조회
  async findAll(): Promise<Coupon[]> {
    return this.em.find(Coupon, {}, { orderBy: { createdAt: 'DESC' } });
  }

  // 발급 가능한 쿠폰 조회
  async findAvailableCoupons(): Promise<Coupon[]> {
    const now = new Date();
    const coupons = await this.em.find(
      Coupon,
      {
        startAt: { $lte: now },
        $or: [{ endAt: { $gte: now } }, { endAt: null }],
      },
      { orderBy: { createdAt: 'DESC' } },
    );

    // 발급 가능한 쿠폰만 필터링
    return coupons.filter(
      (c) => c.totalQuantity === null || c.issuedQuantity < c.totalQuantity,
    );
  }

  // ==================== 생성 (Create) ====================

  // 쿠폰 생성
  async create(coupon: Coupon): Promise<Coupon> {
    await this.em.persistAndFlush(coupon);
    return coupon;
  }

  // ==================== 수정 (Update) ====================

  // 쿠폰 업데이트
  async update(coupon: Coupon): Promise<Coupon> {
    await this.em.flush();
    return coupon;
  }

  // 쿠폰 발급 수량 증가 (원자적 연산)
  async increaseIssuedQuantity(couponId: string): Promise<void> {
    await this.em.nativeUpdate(
      Coupon,
      { id: couponId },
      { issuedQuantity: raw('issued_quantity + 1') },
    );
  }
}
