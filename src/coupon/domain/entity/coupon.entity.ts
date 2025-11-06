import { CouponType, CouponScope } from '@prisma/client';

export interface CouponProps {
  id: string;
  name: string;
  type: CouponType;
  scope: CouponScope;
  discountAmount: number | null;
  discountRate: number | null;
  maxDiscountAmount: number | null;
  minPurchaseAmount: number | null;
  startAt: Date;
  endAt: Date | null;
  validityDays: number | null;
  totalQuantity: number | null; // null = 무제한
  issuedQuantity: number;
  createdAt: Date;
}

export type CreateCouponDto = Omit<
  CouponProps,
  'id' | 'issuedQuantity' | 'createdAt'
> & {
  startAt?: Date;
};

export class Coupon {
  private readonly _id: string;
  private _name: string;
  private readonly _type: CouponType;
  private readonly _scope: CouponScope;
  private _discountAmount: number | null;
  private _discountRate: number | null;
  private _maxDiscountAmount: number | null;
  private _minPurchaseAmount: number | null;
  private _startAt: Date;
  private _endAt: Date | null;
  private _validityDays: number | null;
  private _totalQuantity: number | null; // null = 무제한
  private _issuedQuantity: number;
  private readonly _createdAt: Date;

  constructor(props: CouponProps) {
    this._id = props.id;
    this._name = props.name;
    this._type = props.type;
    this._scope = props.scope;
    this._discountAmount = props.discountAmount;
    this._discountRate = props.discountRate;
    this._maxDiscountAmount = props.maxDiscountAmount;
    this._minPurchaseAmount = props.minPurchaseAmount;
    this._startAt = props.startAt;
    this._endAt = props.endAt;
    this._validityDays = props.validityDays;
    this._totalQuantity = props.totalQuantity;
    this._issuedQuantity = props.issuedQuantity;
    this._createdAt = props.createdAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get type(): CouponType {
    return this._type;
  }

  get scope(): CouponScope {
    return this._scope;
  }

  get discountAmount(): number | null {
    return this._discountAmount;
  }

  get discountRate(): number | null {
    return this._discountRate;
  }

  get maxDiscountAmount(): number | null {
    return this._maxDiscountAmount;
  }

  get minPurchaseAmount(): number | null {
    return this._minPurchaseAmount;
  }

  get startAt(): Date {
    return this._startAt;
  }

  get endAt(): Date | null {
    return this._endAt;
  }

  get validityDays(): number | null {
    return this._validityDays;
  }

  get totalQuantity(): number | null {
    return this._totalQuantity;
  }

  get issuedQuantity(): number {
    return this._issuedQuantity;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // BR-038: 쿠폰 발급 가능 여부 확인
  canIssue(): boolean {
    const now = new Date();

    // 발급 시작일 확인
    if (this._startAt > now) {
      return false;
    }

    // 발급 종료일 확인
    if (this._endAt && this._endAt < now) {
      return false;
    }

    // 수량 확인 (totalQuantity가 null이면 무제한)
    if (
      this._totalQuantity !== null &&
      this._issuedQuantity >= this._totalQuantity
    ) {
      return false;
    }

    return true;
  }

  // BR-038: 발급 수량 증가
  increaseIssuedQuantity(): void {
    // totalQuantity가 null이 아닐 때만 수량 체크 (null = 무제한)
    if (
      this._totalQuantity !== null &&
      this._issuedQuantity >= this._totalQuantity
    ) {
      throw new Error('쿠폰 발급 가능 수량을 초과했습니다.');
    }
    this._issuedQuantity += 1;
  }

  // 쿠폰 타입 검증
  validateCouponType(): void {
    if (this._type === CouponType.AMOUNT) {
      if (!this._discountAmount || this._discountAmount <= 0) {
        throw new Error('고정 금액 할인 쿠폰은 할인 금액이 필요합니다.');
      }
    } else if (this._type === CouponType.RATE) {
      if (
        !this._discountRate ||
        this._discountRate <= 0 ||
        this._discountRate > 100
      ) {
        throw new Error('비율 할인 쿠폰은 1~100 사이의 할인율이 필요합니다.');
      }
    }
  }

  // BR-040: UserCoupon 만료일 계산
  calculateExpiredAt(): Date {
    if (this._validityDays !== null) {
      // 발급 기준 만료일
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() + this._validityDays);
      return expiredAt;
    } else if (this._endAt !== null) {
      // 고정 만료일
      return this._endAt;
    } else {
      throw new Error('쿠폰의 유효 기간 정책이 설정되지 않았습니다.');
    }
  }

  // BR-046: 최소 구매 금액 확인
  checkMinPurchaseAmount(amount: number): boolean {
    // 최소 구매 금액이 설정되지 않은 경우 항상 true
    if (!this._minPurchaseAmount) {
      return true;
    }
    return amount >= this._minPurchaseAmount;
  }

  // BR-033, BR-034: 할인 금액 계산
  calculateDiscount(targetAmount: number): number {
    if (this._type === CouponType.AMOUNT) {
      // 고정 금액 할인
      return Math.min(this._discountAmount!, targetAmount);
    } else if (this._type === CouponType.RATE) {
      // 비율 할인
      const discountAmount = Math.floor(
        targetAmount * (this._discountRate! / 100),
      );
      if (this._maxDiscountAmount !== null) {
        return Math.min(discountAmount, this._maxDiscountAmount);
      }
      return discountAmount;
    }
    return 0;
  }

  // Factory 메서드: 신규 쿠폰 생성
  static create(params: {
    id: string;
    name: string;
    type: CouponType;
    scope: CouponScope;
    discountAmount?: number | null;
    discountRate?: number | null;
    maxDiscountAmount?: number | null;
    minPurchaseAmount?: number | null;
    startAt?: Date;
    endAt?: Date | null;
    validityDays?: number | null;
    totalQuantity?: number | null; // null = 무제한
  }): Coupon {
    const now = new Date();
    const coupon = new Coupon({
      id: params.id,
      name: params.name,
      type: params.type,
      scope: params.scope,
      discountAmount: params.discountAmount ?? null,
      discountRate: params.discountRate ?? null,
      maxDiscountAmount: params.maxDiscountAmount ?? null,
      minPurchaseAmount: params.minPurchaseAmount ?? null,
      startAt: params.startAt ?? now,
      endAt: params.endAt ?? null,
      validityDays: params.validityDays ?? null,
      totalQuantity: params.totalQuantity ?? null, // 기본값 null (무제한)
      issuedQuantity: 0,
      createdAt: now,
    });

    // 쿠폰 타입 검증
    coupon.validateCouponType();

    return coupon;
  }
}
