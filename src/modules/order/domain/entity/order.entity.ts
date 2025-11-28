import { Entity, PrimaryKey, Property, Enum, t, Index } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CreateOrderProps } from '../types';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

@Entity({ tableName: 'order' })
@Index({ name: 'fk_order_usedCouponId', properties: ['usedCouponId'] })
@Index({
  name: 'idx_order_userId_createdAt',
  properties: ['userId', 'createdAt'],
})
export class Order {
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  // User 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  userId!: string;

  // 주문 상태
  @Enum(() => OrderStatus)
  status!: OrderStatus;

  // Coupon 엔티티를 참조 (N:1 관계, nullable)
  @Property({ type: t.character, length: 36, nullable: true })
  usedCouponId!: string | null;

  // 기본 가격 (할인 전)
  @Property({ type: t.integer })
  basePrice!: number;

  // 총 할인 금액
  @Property({ type: t.integer })
  discountAmount!: number;

  // 최종 결제 금액
  @Property({ type: t.integer })
  paymentAmount!: number;

  // 수령인 이름
  @Property({ type: t.character, length: 100 })
  recipientName!: string;

  // 수령인 전화번호
  @Property({ type: t.character, length: 20 })
  phone!: string;

  // 우편번호
  @Property({ type: t.character, length: 10 })
  zipCode!: string;

  // 주소
  @Property({ type: t.character, length: 200 })
  address!: string;

  // 상세 주소
  @Property({ type: t.character, length: 200 })
  addressDetail!: string;

  // 배송 요청사항 (null = 없음)
  @Property({ type: t.text, nullable: true })
  deliveryRequest!: string | null;

  // 주문 생성일
  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  // 주문 수정일
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  // =================== Constructor ===================

  protected constructor(data?: Partial<Order>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  static create(params: CreateOrderProps): Order {
    // 가격 검증
    if (params.basePrice < 0) {
      throw new BadRequestException('기본 가격은 0 이상이어야 합니다.');
    }
    if (params.discountAmount < 0) {
      throw new BadRequestException('할인 금액은 0 이상이어야 합니다.');
    }
    if (params.paymentAmount < 0) {
      throw new BadRequestException('결제 금액은 0 이상이어야 합니다.');
    }
    if (params.basePrice < params.discountAmount) {
      throw new BadRequestException(
        '할인 금액은 기본 가격을 초과할 수 없습니다.',
      );
    }

    const order = new Order();
    order.userId = params.userId;
    order.status = OrderStatus.PENDING;
    order.usedCouponId = params.usedCouponId ?? null;
    order.basePrice = params.basePrice;
    order.discountAmount = params.discountAmount;
    order.paymentAmount = params.paymentAmount;
    order.recipientName = params.recipientName;
    order.phone = params.phone;
    order.zipCode = params.zipCode;
    order.address = params.address;
    order.addressDetail = params.addressDetail;
    order.deliveryRequest = params.deliveryRequest ?? null;

    return order;
  }

  // ==================== 조회 ====================

  isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  isPaid(): boolean {
    return this.status === OrderStatus.PAID;
  }

  isShipped(): boolean {
    return this.status === OrderStatus.SHIPPED;
  }

  isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  isFailed(): boolean {
    return this.status === OrderStatus.FAILED;
  }

  canCancel(): boolean {
    return (
      this.status === OrderStatus.PENDING || this.status === OrderStatus.PAID
    );
  }

  isBeforeShipped(): boolean {
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.PAID ||
      this.status === OrderStatus.FAILED
    );
  }

  // ==================== 수정 ====================

  updateStatus(status: OrderStatus): void {
    this.validateStatusChange(this.status, status);
    this.status = status;
  }

  markAsPaid(): void {
    if (!this.isPending()) {
      throw new BadRequestException(
        'PENDING 상태의 주문만 결제 처리할 수 있습니다.',
      );
    }
    this.updateStatus(OrderStatus.PAID);
  }

  cancel(): void {
    if (!this.canCancel()) {
      throw new BadRequestException(
        '주문을 취소할 수 없습니다. (취소 가능 상태: PENDING, PAID)',
      );
    }
    this.updateStatus(OrderStatus.CANCELLED);
  }

  markAsFailed(): void {
    if (!this.isPending()) {
      throw new BadRequestException(
        'PENDING 상태의 주문만 실패 처리할 수 있습니다.',
      );
    }
    this.updateStatus(OrderStatus.FAILED);
  }

  ship(): void {
    if (!this.isPaid()) {
      throw new BadRequestException(
        'PAID 상태의 주문만 배송 시작할 수 있습니다.',
      );
    }
    this.updateStatus(OrderStatus.SHIPPED);
  }

  deliver(): void {
    if (!this.isShipped()) {
      throw new BadRequestException(
        'SHIPPED 상태의 주문만 배송 완료 처리할 수 있습니다.',
      );
    }
    this.updateStatus(OrderStatus.DELIVERED);
  }

  // ==================== 검증 ====================

  private validateStatusChange(from: OrderStatus, to: OrderStatus): void {
    const allowedStatusChanges: Record<OrderStatus, OrderStatus[]> = {
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

    if (!allowedStatusChanges[from].includes(to)) {
      throw new BadRequestException(
        `잘못된 주문 상태 전환입니다. (${from} -> ${to})`,
      );
    }
  }
}
