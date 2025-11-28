import { Entity, PrimaryKey, Property, Enum, t } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CreateCouponProps } from '../types';

export enum CouponType {
  AMOUNT = 'AMOUNT',
  RATE = 'RATE',
}

@Entity({ tableName: 'coupon' })
export class Coupon {
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  // 쿠폰 이름
  @Property({ type: t.character, length: 100 })
  name!: string;

  // 쿠폰 타입 (AMOUNT: 고정 금액 할인, RATE: 비율 할인)
  @Enum(() => CouponType)
  type!: CouponType;

  // 고정 금액 할인 (AMOUNT 타입에서 사용)
  @Property({ type: t.integer, nullable: true })
  discountAmount!: number | null;

  // 할인율 (RATE 타입에서 사용, 1-100)
  @Property({ type: t.integer, nullable: true })
  discountRate!: number | null;

  // 최대 할인 금액 (RATE 타입 제한용)
  @Property({ type: t.integer, nullable: true })
  maxDiscountAmount!: number | null;

  // 최소 구매 금액
  @Property({ type: t.integer, nullable: true })
  minPurchaseAmount!: number | null;

  // 쿠폰 발급 시작일
  @Property({ onCreate: () => new Date() })
  startAt!: Date;

  // 쿠폰 발급 종료일 (null = 무기한)
  @Property({ nullable: true })
  endAt!: Date | null;

  // 발급 후 유효 기간 (일)
  @Property({ type: t.integer, nullable: true })
  validityDays!: number | null;

  // 발급 가능 수량 (null = 무제한)
  @Property({ type: t.integer, nullable: true })
  totalQuantity!: number | null;

  // 현재 발급된 수량
  @Property({ type: t.integer, default: 0 })
  issuedQuantity: number = 0;

  // 쿠폰 생성일
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  // =================== Constructor ===================

  // protected로 만들어서 외부에서 new Coupon() 못하게 막음
  protected constructor(data?: Partial<Coupon>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  static create(params: CreateCouponProps): Coupon {
    const coupon = new Coupon();
    coupon.name = params.name;
    coupon.type = params.type;
    coupon.discountAmount = params.discountAmount ?? null;
    coupon.discountRate = params.discountRate ?? null;
    coupon.maxDiscountAmount = params.maxDiscountAmount ?? null;
    coupon.minPurchaseAmount = params.minPurchaseAmount ?? null;
    coupon.startAt = params.startAt ?? new Date();
    coupon.endAt = params.endAt ?? null;
    coupon.validityDays = params.validityDays ?? null;
    coupon.totalQuantity = params.totalQuantity ?? null;
    coupon.issuedQuantity = 0;

    // 쿠폰 타입 검증
    coupon.validateCouponType();

    // 유효 기간 정책 검증
    coupon.validateValidityPeriod();

    return coupon;
  }

  // ==================== 조회 ====================

  canIssue(): boolean {
    const now = new Date();

    // 발급 시작일 확인
    if (this.startAt > now) {
      return false;
    }

    // 발급 종료일 확인
    if (this.endAt && this.endAt < now) {
      return false;
    }

    // 수량 확인 (totalQuantity가 null이면 무제한)
    if (
      this.totalQuantity !== null &&
      this.issuedQuantity >= this.totalQuantity
    ) {
      return false;
    }

    return true;
  }

  // 무제한 쿠폰 여부
  isUnlimited(): boolean {
    return this.totalQuantity === null;
  }

  // 잔여 수량 계산
  getRemainingQuantity(): number | null {
    if (this.totalQuantity === null) {
      return null; // 무제한
    }
    return this.totalQuantity - this.issuedQuantity;
  }

  checkMinPurchaseAmount(amount: number): boolean {
    // 최소 구매 금액이 설정되지 않은 경우 항상 true
    if (!this.minPurchaseAmount) {
      return true;
    }
    return amount >= this.minPurchaseAmount;
  }

  calculateDiscount(targetAmount: number): number {
    if (this.type === CouponType.AMOUNT) {
      // 고정 금액 할인
      return Math.min(this.discountAmount!, targetAmount);
    } else if (this.type === CouponType.RATE) {
      // 비율 할인
      const discountAmount = Math.floor(
        targetAmount * (this.discountRate! / 100),
      );
      if (this.maxDiscountAmount !== null) {
        return Math.min(discountAmount, this.maxDiscountAmount);
      }
      return discountAmount;
    }
    return 0;
  }

  calculateExpiredAt(): Date {
    if (this.validityDays !== null) {
      // 발급 기준 만료일
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + this.validityDays);
      return expiredAt;
    } else if (this.endAt !== null) {
      // 고정 만료일
      return this.endAt;
    } else {
      throw new BadRequestException(
        '쿠폰의 유효 기간 정책이 설정되지 않았습니다.',
      );
    }
  }

  // ==================== 수정 ====================

  increaseIssuedQuantity(): void {
    // totalQuantity가 null이 아닐 때만 수량 체크 (null = 무제한)
    if (
      this.totalQuantity !== null &&
      this.issuedQuantity >= this.totalQuantity
    ) {
      throw new BadRequestException('쿠폰 발급 가능 수량을 초과했습니다.');
    }
    this.issuedQuantity += 1;
  }

  // ==================== 검증 ====================

  private validateCouponType(): void {
    if (this.type === CouponType.AMOUNT) {
      if (!this.discountAmount || this.discountAmount <= 0) {
        throw new BadRequestException(
          '고정 금액 할인 쿠폰은 할인 금액이 필요합니다.',
        );
      }
    } else if (this.type === CouponType.RATE) {
      if (
        !this.discountRate ||
        this.discountRate <= 0 ||
        this.discountRate > 100
      ) {
        throw new BadRequestException(
          '비율 할인 쿠폰은 1~100 사이의 할인율이 필요합니다.',
        );
      }
    }
  }

  private validateValidityPeriod(): void {
    // endAt과 validityDays 중 하나만 있어야 함
    if (!this.endAt && !this.validityDays) {
      throw new BadRequestException(
        '쿠폰 만료 정책을 설정해야 합니다. (endAt 또는 validityDays 중 하나 필수)',
      );
    }

    if (this.endAt && this.validityDays) {
      throw new BadRequestException(
        'endAt과 validityDays는 동시에 사용할 수 없습니다.',
      );
    }
  }
}
