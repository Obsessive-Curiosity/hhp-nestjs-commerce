import { Entity, PrimaryKey, Property, Enum, t } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

export enum OrderItemClaimStatus {
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURNED = 'RETURNED',
  EXCHANGE_REQUESTED = 'EXCHANGE_REQUESTED',
  EXCHANGED = 'EXCHANGED',
}

export type CreateOrderItemProps = {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  paymentAmount: number;
};

@Entity({ tableName: 'order_item' })
export class OrderItem {
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  // Order 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  orderId!: string;

  // Product 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  productId!: string;

  // 주문 수량
  @Property({ type: t.integer })
  quantity!: number;

  // 상품 단가
  @Property({ type: t.integer })
  unitPrice!: number;

  // 할인 금액
  @Property({ type: t.integer })
  discountAmount!: number;

  // 결제 금액
  @Property({ type: t.integer })
  paymentAmount!: number;

  // 클레임 상태 (null = 클레임 없음)
  @Enum(() => OrderItemClaimStatus)
  @Property({ nullable: true })
  claimStatus!: OrderItemClaimStatus | null;

  // 주문 항목 생성일
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  // =================== Constructor ===================

  protected constructor(data?: Partial<OrderItem>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  static create(params: CreateOrderItemProps): OrderItem {
    // 가격 검증
    if (params.quantity <= 0) {
      throw new BadRequestException('수량은 0보다 커야 합니다.');
    }
    if (params.unitPrice < 0) {
      throw new BadRequestException('단가는 0 이상이어야 합니다.');
    }
    if (params.discountAmount < 0) {
      throw new BadRequestException('할인 금액은 0 이상이어야 합니다.');
    }
    if (params.paymentAmount < 0) {
      throw new BadRequestException('결제 금액은 0 이상이어야 합니다.');
    }

    const orderItem = new OrderItem();
    orderItem.orderId = params.orderId;
    orderItem.productId = params.productId;
    orderItem.quantity = params.quantity;
    orderItem.unitPrice = params.unitPrice;
    orderItem.discountAmount = params.discountAmount;
    orderItem.paymentAmount = params.paymentAmount;
    orderItem.claimStatus = null;

    // 가격 검증
    orderItem.validatePricing();

    return orderItem;
  }

  // ==================== 조회 ====================

  hasNoClaim(): boolean {
    return this.claimStatus === null;
  }

  isReturnRequested(): boolean {
    return this.claimStatus === OrderItemClaimStatus.RETURN_REQUESTED;
  }

  isReturned(): boolean {
    return this.claimStatus === OrderItemClaimStatus.RETURNED;
  }

  isExchangeRequested(): boolean {
    return this.claimStatus === OrderItemClaimStatus.EXCHANGE_REQUESTED;
  }

  isExchanged(): boolean {
    return this.claimStatus === OrderItemClaimStatus.EXCHANGED;
  }

  getTotalPrice(): number {
    return this.unitPrice * this.quantity;
  }

  // ==================== 수정 ====================

  updateClaimStatus(status: OrderItemClaimStatus | null): void {
    this.claimStatus = status;
  }

  requestReturn(): void {
    if (this.claimStatus !== null) {
      throw new BadRequestException('이미 클레임이 진행 중인 주문 항목입니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.RETURN_REQUESTED);
  }

  completeReturn(): void {
    if (!this.isReturnRequested()) {
      throw new BadRequestException('반품 요청 상태가 아닙니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.RETURNED);
  }

  requestExchange(): void {
    if (this.claimStatus !== null) {
      throw new BadRequestException('이미 클레임이 진행 중인 주문 항목입니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.EXCHANGE_REQUESTED);
  }

  completeExchange(): void {
    if (!this.isExchangeRequested()) {
      throw new BadRequestException('교환 요청 상태가 아닙니다.');
    }
    this.updateClaimStatus(OrderItemClaimStatus.EXCHANGED);
  }

  // ==================== 검증 ====================

  private validatePricing(): void {
    const totalPrice = this.getTotalPrice();
    if (this.discountAmount > totalPrice) {
      throw new BadRequestException(
        '할인 금액이 총 가격을 초과할 수 없습니다.',
      );
    }
    if (this.paymentAmount !== totalPrice - this.discountAmount) {
      throw new BadRequestException('결제 금액이 올바르지 않습니다.');
    }
  }
}
