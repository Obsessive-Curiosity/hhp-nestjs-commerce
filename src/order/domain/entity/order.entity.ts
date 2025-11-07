import { OrderStatus } from '@prisma/client';

export interface OrderProps {
  id: string;
  userId: string;
  status: OrderStatus;
  usedCouponId: string | null;
  basePrice: number;
  discountAmount: number;
  paymentAmount: number;
  recipientName: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  deliveryRequest: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private readonly _id: string;
  private readonly _userId: string;
  private _status: OrderStatus;
  private readonly _usedCouponId: string | null;
  private readonly _basePrice: number;
  private readonly _discountAmount: number;
  private readonly _paymentAmount: number;
  private readonly _recipientName: string;
  private readonly _phone: string;
  private readonly _zipCode: string;
  private readonly _address: string;
  private readonly _addressDetail: string;
  private readonly _deliveryRequest: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // 더티 체킹
  private _dirtyFields: Set<string> = new Set();

  constructor(props: OrderProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._status = props.status;
    this._usedCouponId = props.usedCouponId;
    this._basePrice = props.basePrice;
    this._discountAmount = props.discountAmount;
    this._paymentAmount = props.paymentAmount;
    this._recipientName = props.recipientName;
    this._phone = props.phone;
    this._zipCode = props.zipCode;
    this._address = props.address;
    this._addressDetail = props.addressDetail;
    this._deliveryRequest = props.deliveryRequest;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get usedCouponId(): string | null {
    return this._usedCouponId;
  }

  get basePrice(): number {
    return this._basePrice;
  }

  get discountAmount(): number {
    return this._discountAmount;
  }

  get paymentAmount(): number {
    return this._paymentAmount;
  }

  get recipientName(): string {
    return this._recipientName;
  }

  get phone(): string {
    return this._phone;
  }

  get zipCode(): string {
    return this._zipCode;
  }

  get address(): string {
    return this._address;
  }

  get addressDetail(): string {
    return this._addressDetail;
  }

  get deliveryRequest(): string | null {
    return this._deliveryRequest;
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

  // 주문 상태 체크 메서드
  isPending(): boolean {
    return this._status === OrderStatus.PENDING;
  }

  isPaid(): boolean {
    return this._status === OrderStatus.PAID;
  }

  isShipped(): boolean {
    return this._status === OrderStatus.SHIPPED;
  }

  isDelivered(): boolean {
    return this._status === OrderStatus.DELIVERED;
  }

  isCancelled(): boolean {
    return this._status === OrderStatus.CANCELLED;
  }

  isFailed(): boolean {
    return this._status === OrderStatus.FAILED;
  }

  // 취소 가능 여부 확인
  canCancel(): boolean {
    return (
      this._status === OrderStatus.PENDING || this._status === OrderStatus.PAID
    );
  }

  // 배송 전 여부 확인 (쿠폰 복원 조건)
  isBeforeShipped(): boolean {
    return (
      this._status === OrderStatus.PENDING ||
      this._status === OrderStatus.PAID ||
      this._status === OrderStatus.FAILED
    );
  }

  // 주문 상태 변경
  updateStatus(status: OrderStatus): void {
    // 상태 변경 유효성 검증
    this.validateStatusTransition(this._status, status);

    this._status = status;
    this._updatedAt = new Date();
    this._dirtyFields.add('status');
    this._dirtyFields.add('updatedAt');
  }

  // 결제 완료 처리
  markAsPaid(): void {
    if (!this.isPending()) {
      throw new Error('PENDING 상태의 주문만 결제 처리할 수 있습니다.');
    }
    this.updateStatus(OrderStatus.PAID);
  }

  // 주문 취소 처리
  cancel(): void {
    if (!this.canCancel()) {
      throw new Error(
        '주문을 취소할 수 없습니다. (취소 가능 상태: PENDING, PAID)',
      );
    }
    this.updateStatus(OrderStatus.CANCELLED);
  }

  // 결제 실패 처리
  markAsFailed(): void {
    if (!this.isPending()) {
      throw new Error('PENDING 상태의 주문만 실패 처리할 수 있습니다.');
    }
    this.updateStatus(OrderStatus.FAILED);
  }

  // 배송 시작 처리
  ship(): void {
    if (!this.isPaid()) {
      throw new Error('PAID 상태의 주문만 배송 시작할 수 있습니다.');
    }
    this.updateStatus(OrderStatus.SHIPPED);
  }

  // 배송 완료 처리
  deliver(): void {
    if (!this.isShipped()) {
      throw new Error('SHIPPED 상태의 주문만 배송 완료 처리할 수 있습니다.');
    }
    this.updateStatus(OrderStatus.DELIVERED);
  }

  // 상태 전환 유효성 검증
  private validateStatusTransition(from: OrderStatus, to: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [
        OrderStatus.PAID,
        OrderStatus.CANCELLED,
        OrderStatus.FAILED,
      ],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.FAILED]: [],
    };

    if (!validTransitions[from].includes(to)) {
      throw new Error(`잘못된 주문 상태 전환입니다. (${from} -> ${to})`);
    }
  }

  // Factory 메서드: 신규 주문 생성
  static create(params: {
    id: string;
    userId: string;
    usedCouponId: string | null;
    basePrice: number;
    discountAmount: number;
    paymentAmount: number;
    recipientName: string;
    phone: string;
    zipCode: string;
    address: string;
    addressDetail: string;
    deliveryRequest?: string | null;
  }): Order {
    const now = new Date();

    // 가격 검증
    if (params.basePrice < 0) {
      throw new Error('기본 가격은 0 이상이어야 합니다.');
    }
    if (params.discountAmount < 0) {
      throw new Error('할인 금액은 0 이상이어야 합니다.');
    }
    if (params.paymentAmount < 0) {
      throw new Error('결제 금액은 0 이상이어야 합니다.');
    }
    if (params.basePrice < params.discountAmount) {
      throw new Error('할인 금액은 기본 가격을 초과할 수 없습니다.');
    }

    return new Order({
      id: params.id,
      userId: params.userId,
      status: OrderStatus.PENDING,
      usedCouponId: params.usedCouponId,
      basePrice: params.basePrice,
      discountAmount: params.discountAmount,
      paymentAmount: params.paymentAmount,
      recipientName: params.recipientName,
      phone: params.phone,
      zipCode: params.zipCode,
      address: params.address,
      addressDetail: params.addressDetail,
      deliveryRequest: params.deliveryRequest ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
