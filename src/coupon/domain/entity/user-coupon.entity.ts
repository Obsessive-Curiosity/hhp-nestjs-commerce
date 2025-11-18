import { Entity, PrimaryKey, Property, Enum, t } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

export enum CouponStatus {
  ISSUED = 'ISSUED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

export type CreateUserCouponProps = {
  userId: string;
  couponId: string;
  expiredAt: Date;
};

@Entity({ tableName: 'user_coupon' })
export class UserCoupon {
  /**
   * 대리키 ID
   *
   * userId + couponId 복합키가 아닌 별도 ID를 사용하는 이유:
   * 1. Order 엔티티에서 특정 UserCoupon 인스턴스를 참조하기 위함
   * 2. 쿠폰 발급/사용/만료의 완전한 이력 추적
   * 3. 주문 취소 시 정확한 쿠폰 복구 지원
   * 4. API/URL에서 단일 값으로 식별 가능
   *
   * Note: userId + couponId의 유니크 제약은 별도 인덱스로 관리
   */
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  // User 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  userId!: string;

  // Coupon 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  couponId!: string;

  // 쿠폰 상태 (ISSUED: 발급됨, USED: 사용됨, EXPIRED: 만료됨)
  @Enum(() => CouponStatus)
  status!: CouponStatus;

  // 쿠폰 발급일
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  // 쿠폰 만료일
  @Property()
  expiredAt!: Date;

  // 쿠폰 사용일 (null = 미사용)
  @Property({ nullable: true })
  usedAt!: Date | null;

  // =================== Constructor ===================

  protected constructor(data?: Partial<UserCoupon>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  static create(params: CreateUserCouponProps): UserCoupon {
    const userCoupon = new UserCoupon();
    userCoupon.userId = params.userId;
    userCoupon.couponId = params.couponId;
    userCoupon.status = CouponStatus.ISSUED;
    userCoupon.expiredAt = params.expiredAt;
    userCoupon.usedAt = null;

    return userCoupon;
  }

  // ==================== 조회 ====================

  isExpired(): boolean {
    if (this.status === CouponStatus.EXPIRED) {
      return true;
    }
    return new Date() > this.expiredAt;
  }

  canUse(): boolean {
    if (this.status !== CouponStatus.ISSUED) {
      return false;
    }
    if (this.isExpired()) {
      return false;
    }
    return true;
  }

  // ==================== 수정 ====================

  use(): void {
    if (!this.canUse()) {
      throw new BadRequestException('사용할 수 없는 쿠폰입니다.');
    }
    this.status = CouponStatus.USED;
    this.usedAt = new Date();
  }

  restore(): void {
    if (this.status !== CouponStatus.USED) {
      throw new BadRequestException('사용된 쿠폰만 복구할 수 있습니다.');
    }
    if (this.isExpired()) {
      throw new BadRequestException('만료된 쿠폰은 복구할 수 없습니다.');
    }
    this.status = CouponStatus.ISSUED;
    this.usedAt = null;
  }

  expire(): void {
    if (this.status !== CouponStatus.ISSUED) {
      throw new BadRequestException('발급된 쿠폰만 만료 처리할 수 있습니다.');
    }
    this.status = CouponStatus.EXPIRED;
  }
}
