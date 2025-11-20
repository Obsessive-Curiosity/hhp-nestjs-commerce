import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderItem, OrderItemClaimStatus } from '../entity/order-item.entity';
import {
  IOrderItemRepository,
  ORDER_ITEM_REPOSITORY,
} from '../interface/order-item.repository.interface';

@Injectable()
export class OrderItemService {
  constructor(
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly orderItemRepository: IOrderItemRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 주문 항목 조회 by ID
  async findOrderItemById(orderItemId: string): Promise<OrderItem> {
    const orderItem = await this.orderItemRepository.findById(orderItemId);

    if (!orderItem) {
      throw new NotFoundException(
        `ID ${orderItemId}인 주문 항목을 찾을 수 없습니다.`,
      );
    }

    return orderItem;
  }

  // 주문별 주문 항목 목록 조회
  async findOrderItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderItemRepository.findByOrderId(orderId);
  }

  // 상품별 주문 항목 목록 조회
  async findOrderItemsByProductId(productId: string): Promise<OrderItem[]> {
    return this.orderItemRepository.findByProductId(productId);
  }

  // 주문별 주문 항목 개수 조회
  async countOrderItems(orderId: string): Promise<number> {
    return this.orderItemRepository.countByOrderId(orderId);
  }

  // ==================== 생성 (Create) ====================

  // 새 주문 항목 생성
  async createOrderItem(params: {
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    paymentAmount: number;
  }): Promise<OrderItem> {
    const orderItem = OrderItem.create(params);

    return this.orderItemRepository.create(orderItem);
  }

  // ==================== 생성 (Batch) ====================

  // 여러 주문 항목 일괄 생성
  async createOrderItems(
    items: Array<{
      orderId: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      discountAmount: number;
      paymentAmount: number;
    }>,
  ): Promise<OrderItem[]> {
    const orderItems = items.map((item) => OrderItem.create(item));

    return this.orderItemRepository.createMany(orderItems);
  }

  // ==================== 수정 (Update) ====================

  // 클레임 상태 업데이트
  async updateClaimStatus(
    orderItemId: string,
    claimStatus: OrderItemClaimStatus | null,
  ): Promise<OrderItem> {
    const orderItem = await this.findOrderItemById(orderItemId);

    orderItem.updateClaimStatus(claimStatus);

    return this.orderItemRepository.update(orderItem);
  }

  // 반품 요청
  async requestReturn(orderItemId: string): Promise<OrderItem> {
    const orderItem = await this.findOrderItemById(orderItemId);

    orderItem.requestReturn();

    return this.orderItemRepository.update(orderItem);
  }

  // 반품 완료
  async completeReturn(orderItemId: string): Promise<OrderItem> {
    const orderItem = await this.findOrderItemById(orderItemId);

    orderItem.completeReturn();

    return this.orderItemRepository.update(orderItem);
  }

  // 교환 요청
  async requestExchange(orderItemId: string): Promise<OrderItem> {
    const orderItem = await this.findOrderItemById(orderItemId);

    orderItem.requestExchange();

    return this.orderItemRepository.update(orderItem);
  }

  // 교환 완료
  async completeExchange(orderItemId: string): Promise<OrderItem> {
    const orderItem = await this.findOrderItemById(orderItemId);

    orderItem.completeExchange();

    return this.orderItemRepository.update(orderItem);
  }

  // ==================== 삭제 (Delete) ====================

  // 주문별 주문 항목 삭제 (트랜잭션 롤백용)
  async deleteByOrderId(orderId: string): Promise<void> {
    const orderItems = await this.findOrderItemsByOrderId(orderId);

    for (const item of orderItems) {
      await this.orderItemRepository.delete(item.id);
    }
  }
}
