import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { OrderItem } from '../domain/entity/order-item.entity';
import { IOrderItemRepository } from '../domain/interface/order-item.repository.interface';

@Injectable()
export class OrderItemRepository implements IOrderItemRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // ID로 주문 항목 조회
  async findById(id: string): Promise<OrderItem | null> {
    return this.em.findOne(OrderItem, { id });
  }

  // 주문별 주문 항목 목록 조회
  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.em.find(
      OrderItem,
      { orderId },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  // 상품별 주문 항목 목록 조회
  async findByProductId(productId: string): Promise<OrderItem[]> {
    return this.em.find(
      OrderItem,
      { productId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  // 주문별 주문 항목 개수 조회
  async countByOrderId(orderId: string): Promise<number> {
    return this.em.count(OrderItem, { orderId });
  }

  // ==================== 생성 (Create) ====================

  // 주문 항목 생성
  async create(orderItem: OrderItem): Promise<OrderItem> {
    await this.em.persistAndFlush(orderItem);
    return orderItem;
  }

  // ==================== 생성 (Batch) ====================

  // 여러 주문 항목 일괄 생성
  async createMany(orderItems: OrderItem[]): Promise<OrderItem[]> {
    orderItems.forEach((item) => this.em.persist(item));
    await this.em.flush();
    return orderItems;
  }

  // ==================== 수정 (Update) ====================

  // 주문 항목 수정
  async update(orderItem: OrderItem): Promise<OrderItem> {
    await this.em.flush();
    return orderItem;
  }

  // ==================== 삭제 (Delete) ====================

  // 주문 항목 삭제
  async delete(orderItemId: string): Promise<void> {
    const orderItem = await this.em.findOne(OrderItem, { id: orderItemId });
    if (orderItem) {
      await this.em.removeAndFlush(orderItem);
    }
  }
}
