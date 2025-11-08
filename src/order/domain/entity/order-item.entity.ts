import { OrderItemClaimStatus } from '@prisma/client';

export interface OrderItemProps {
  id: string;
  orderId: string;
  productId: string;
  usedItemCouponId: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  paymentAmount: number;
  claimStatus: OrderItemClaimStatus | null;
  createdAt: Date;
}

export class OrderItem {
  private readonly _id: string;
  private readonly _orderId: string;
  private readonly _productId: string;
  private readonly _usedItemCouponId: string | null;
  private readonly _quantity: number;
  private readonly _unitPrice: number;
  private readonly _discountAmount: number;
  private readonly _paymentAmount: number;
  private _claimStatus: OrderItemClaimStatus | null;
  private readonly _createdAt: Date;

  // 더티 체킹
  private _dirtyFields: Set<string> = new Set();

  constructor(props: OrderItemProps) {
    this._id = props.id;
    this._orderId = props.orderId;
    this._productId = props.productId;
    this._usedItemCouponId = props.usedItemCouponId;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._discountAmount = props.discountAmount;
    this._paymentAmount = props.paymentAmount;
    this._claimStatus = props.claimStatus;
    this._createdAt = props.createdAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get orderId(): string {
    return this._orderId;
  }

  get productId(): string {
    return this._productId;
  }

  get usedItemCouponId(): string | null {
    return this._usedItemCouponId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  get discountAmount(): number {
    return this._discountAmount;
  }

  get paymentAmount(): number {
    return this._paymentAmount;
  }

  get claimStatus(): OrderItemClaimStatus | null {
    return this._claimStatus;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // 더티 체킹 관련 메서드
  getDirtyFields(): Set<string> {
    return this._dirtyFields;
  }

  clearDirtyFields(): void {
    this._dirtyFields.clear();
  }

  // 클레임 상태 체크 메서드
  hasNoClaim(): boolean {
    return this._claimStatus === null;
  }

  isReturnRequested(): boolean {
    return this._claimStatus === OrderItemClaimStatus.RETURN_REQUESTED;
  }

  isReturned(): boolean {
    return this._claimStatus === OrderItemClaimStatus.RETURNED;
  }

  isExchangeRequested(): boolean {
    return this._claimStatus === OrderItemClaimStatus.EXCHANGE_REQUESTED;
  }

  isExchanged(): boolean {
    return this._claimStatus === OrderItemClaimStatus.EXCHANGED;
  }

  // 클레임 상태 변경
  updateClaimStatus(status: OrderItemClaimStatus | null): void {
    this._claimStatus = status;
    this._dirtyFields.add('claimStatus');
  }

  // 반품 요청
  requestReturn(): void {
    if (this._claimStatus !== null) {
      throw new Error('이미 클레임이 진행 중인 주문 항목입니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.RETURN_REQUESTED);
  }

  // 반품 완료
  completeReturn(): void {
    if (!this.isReturnRequested()) {
      throw new Error('반품 요청 상태가 아닙니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.RETURNED);
  }

  // 교환 요청
  requestExchange(): void {
    if (this._claimStatus !== null) {
      throw new Error('이미 클레임이 진행 중인 주문 항목입니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.EXCHANGE_REQUESTED);
  }

  // 교환 완료
  completeExchange(): void {
    if (!this.isExchangeRequested()) {
      throw new Error('교환 요청 상태가 아닙니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.EXCHANGED);
  }

  // 총 가격 계산 (할인 전)
  getTotalPrice(): number {
    return this._unitPrice * this._quantity;
  }

  // 할인 후 가격 검증
  validatePricing(): void {
    const totalPrice = this.getTotalPrice();
    if (this._discountAmount > totalPrice) {
      throw new Error('할인 금액이 총 가격을 초과할 수 없습니다.');
    }
    if (this._paymentAmount !== totalPrice - this._discountAmount) {
      throw new Error('결제 금액이 올바르지 않습니다.');
    }
  }

  // Factory 메서드: 신규 주문 항목 생성
  static create(params: {
    id: string;
    orderId: string;
    productId: string;
    usedItemCouponId: string | null;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    paymentAmount: number;
  }): OrderItem {
    // 가격 검증
    if (params.quantity <= 0) {
      throw new Error('수량은 0보다 커야 합니다.');
    }
    if (params.unitPrice < 0) {
      throw new Error('단가는 0 이상이어야 합니다.');
    }
    if (params.discountAmount < 0) {
      throw new Error('할인 금액은 0 이상이어야 합니다.');
    }
    if (params.paymentAmount < 0) {
      throw new Error('결제 금액은 0 이상이어야 합니다.');
    }

    const orderItem = new OrderItem({
      id: params.id,
      orderId: params.orderId,
      productId: params.productId,
      usedItemCouponId: params.usedItemCouponId,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
      discountAmount: params.discountAmount,
      paymentAmount: params.paymentAmount,
      claimStatus: null,
      createdAt: new Date(),
    });

    // 가격 검증
    orderItem.validatePricing();

    return orderItem;
  }
}
