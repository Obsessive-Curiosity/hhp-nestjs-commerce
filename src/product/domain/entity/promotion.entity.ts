export interface PromotionProps {
  id: string;
  productId: string;
  paidQuantity: number;
  freeQuantity: number;
  startAt: Date;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Promotion {
  private readonly _id: string;
  private readonly _productId: string;
  private _paidQuantity: number;
  private _freeQuantity: number;
  private _startAt: Date;
  private _endAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // 더티 체킹
  private _dirtyFields: Set<string> = new Set();

  constructor(props: PromotionProps) {
    this._id = props.id;
    this._productId = props.productId;
    this._paidQuantity = props.paidQuantity;
    this._freeQuantity = props.freeQuantity;
    this._startAt = props.startAt;
    this._endAt = props.endAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get productId(): string {
    return this._productId;
  }

  get paidQuantity(): number {
    return this._paidQuantity;
  }

  get freeQuantity(): number {
    return this._freeQuantity;
  }

  get startAt(): Date {
    return this._startAt;
  }

  get endAt(): Date | null {
    return this._endAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // 더티 체킹 관련 메서드
  getDirtyFields(): Set<string> {
    return this._dirtyFields;
  }

  clearDirtyFields(): void {
    this._dirtyFields.clear();
  }

  // 프로모션 형식 문자열 반환 (예: "10+1")
  getPromotionFormat(): string {
    return `${this._paidQuantity}+${this._freeQuantity}`;
  }

  // 프로모션 활성 여부 확인
  isActive(now: Date = new Date()): boolean {
    const isStarted = this._startAt <= now;
    const isNotEnded = this._endAt === null || this._endAt >= now;
    return isStarted && isNotEnded;
  }

  // 프로모션 만료 확인
  isExpired(now: Date = new Date()): boolean {
    if (this._endAt === null) return false;
    return this._endAt < now;
  }

  // 프로모션 시작 전 확인
  isNotStarted(now: Date = new Date()): boolean {
    return this._startAt > now;
  }

  // 기간 검증
  validatePeriod(): void {
    if (this._endAt && this._endAt <= this._startAt) {
      throw new Error('프로모션 종료일은 시작일보다 나중이어야 합니다.');
    }
  }

  // 수량 검증
  validateQuantities(): void {
    if (this._paidQuantity <= 0) {
      throw new Error('유료 수량은 0보다 커야 합니다.');
    }
    if (this._freeQuantity <= 0) {
      throw new Error('무료 수량은 0보다 커야 합니다.');
    }
  }

  // 프로모션 적용 가능한 세트 수 계산
  calculateApplicableSets(quantity: number): number {
    if (quantity < this._paidQuantity) return 0;
    return Math.floor(quantity / this._paidQuantity);
  }

  // 프로모션으로 받을 수 있는 무료 수량 계산
  calculateFreeQuantity(quantity: number): number {
    const sets = this.calculateApplicableSets(quantity);
    return sets * this._freeQuantity;
  }

  // 실제 지불해야 할 수량 계산
  calculatePayableQuantity(quantity: number): number {
    const freeQty = this.calculateFreeQuantity(quantity);
    return quantity - freeQty;
  }

  // 프로모션 정보 업데이트
  updateInfo(params: {
    paidQuantity?: number;
    freeQuantity?: number;
    startAt?: Date;
    endAt?: Date | null;
  }): void {
    if (params.paidQuantity !== undefined) {
      this._paidQuantity = params.paidQuantity;
      this._dirtyFields.add('paidQuantity');
    }
    if (params.freeQuantity !== undefined) {
      this._freeQuantity = params.freeQuantity;
      this._dirtyFields.add('freeQuantity');
    }
    if (params.startAt !== undefined) {
      this._startAt = params.startAt;
      this._dirtyFields.add('startAt');
    }
    if (params.endAt !== undefined) {
      this._endAt = params.endAt;
      this._dirtyFields.add('endAt');
    }

    // 검증
    this.validateQuantities();
    this.validatePeriod();

    this._updatedAt = new Date();
    this._dirtyFields.add('updatedAt');
  }

  // Factory 메서드: 신규 프로모션 생성
  static create(params: {
    id: string;
    productId: string;
    paidQuantity: number;
    freeQuantity: number;
    startAt: Date;
    endAt?: Date | null;
  }): Promotion {
    const now = new Date();
    const promotion = new Promotion({
      id: params.id,
      productId: params.productId,
      paidQuantity: params.paidQuantity,
      freeQuantity: params.freeQuantity,
      startAt: params.startAt,
      endAt: params.endAt ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // 검증
    promotion.validateQuantities();
    promotion.validatePeriod();

    return promotion;
  }
}
