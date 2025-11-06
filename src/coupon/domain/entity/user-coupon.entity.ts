import { CouponStatus } from '@prisma/client';
import { Coupon } from './coupon.entity';

export interface UserCouponProps {
  id: string;
  userId: string;
  couponId: string;
  status: CouponStatus;
  createdAt: Date;
  expiredAt: Date;
  usedAt: Date | null;

  // Relations
  coupon?: Coupon;
}

export class UserCoupon {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _couponId: string;
  private _status: CouponStatus;
  private readonly _createdAt: Date;
  private _expiredAt: Date;
  private _usedAt: Date | null;

  // Relations
  private _coupon?: Coupon;

  // 더티 체킹
  private _dirtyFields: Set<string> = new Set();

  constructor(props: UserCouponProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._couponId = props.couponId;
    this._status = props.status;
    this._createdAt = props.createdAt;
    this._expiredAt = props.expiredAt;
    this._usedAt = props.usedAt;
    this._coupon = props.coupon;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get couponId(): string {
    return this._couponId;
  }

  get status(): CouponStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get expiredAt(): Date {
    return this._expiredAt;
  }

  get usedAt(): Date | null {
    return this._usedAt;
  }

  get coupon(): Coupon | undefined {
    return this._coupon;
  }

  // 더티 체킹 관련 메서드
  getDirtyFields(): Set<string> {
    return this._dirtyFields;
  }

  clearDirtyFields(): void {
    this._dirtyFields.clear();
  }

  // BR-045: 만료 여부 확인
  isExpired(): boolean {
    if (this._status === CouponStatus.EXPIRED) {
      return true;
    }
    return new Date() > this._expiredAt;
  }

  // BR-047: 사용 가능 여부 확인
  canUse(): boolean {
    if (this._status !== CouponStatus.ISSUED) {
      return false;
    }
    if (this.isExpired()) {
      return false;
    }
    return true;
  }

  // BR-047: 쿠폰 사용 처리
  use(): void {
    if (!this.canUse()) {
      throw new Error('사용할 수 없는 쿠폰입니다.');
    }
    this._status = CouponStatus.USED;
    this._usedAt = new Date();
    this._dirtyFields.add('status');
    this._dirtyFields.add('usedAt');
  }

  // BR-054: 쿠폰 복구 (주문 취소 시)
  restore(): void {
    if (this._status !== CouponStatus.USED) {
      throw new Error('사용된 쿠폰만 복구할 수 있습니다.');
    }
    if (this.isExpired()) {
      throw new Error('만료된 쿠폰은 복구할 수 없습니다.');
    }
    this._status = CouponStatus.ISSUED;
    this._usedAt = null;
    this._dirtyFields.add('status');
    this._dirtyFields.add('usedAt');
  }

  // 만료 처리
  expire(): void {
    if (this._status !== CouponStatus.ISSUED) {
      throw new Error('발급된 쿠폰만 만료 처리할 수 있습니다.');
    }
    this._status = CouponStatus.EXPIRED;
    this._dirtyFields.add('status');
  }

  // Factory 메서드: 신규 UserCoupon 생성
  static create(params: {
    id: string;
    userId: string;
    couponId: string;
    expiredAt: Date;
  }): UserCoupon {
    const now = new Date();
    return new UserCoupon({
      id: params.id,
      userId: params.userId,
      couponId: params.couponId,
      status: CouponStatus.ISSUED,
      createdAt: now,
      expiredAt: params.expiredAt,
      usedAt: null,
    });
  }
}
