import { OrderItemClaimStatus } from '@prisma/client';
import { OrderItem } from '../entity/order-item.entity';

export interface OrderItemFilterOptions {
  orderId?: string;
  productId?: string;
  claimStatus?: OrderItemClaimStatus;
}

export interface IOrderItemRepository {
  // ID로 주문 항목 조회
  findById(id: string): Promise<OrderItem | null>;

  // 주문 ID로 주문 항목 목록 조회
  findByOrderId(orderId: string): Promise<OrderItem[]>;

  // 상품 ID로 주문 항목 목록 조회
  findByProductId(productId: string): Promise<OrderItem[]>;

  // 주문 항목 생성
  create(orderItem: OrderItem): Promise<OrderItem>;

  // 여러 주문 항목 일괄 생성
  createMany(orderItems: OrderItem[]): Promise<OrderItem[]>;

  // 주문 항목 업데이트
  update(orderItem: OrderItem): Promise<OrderItem>;

  // 주문 항목 삭제 (물리 삭제 - 실제 사용은 거의 없음)
  delete(orderItemId: string): Promise<void>;

  // 주문별 주문 항목 총 개수 조회
  countByOrderId(orderId: string): Promise<number>;
}

// Repository 의존성 주입을 위한 토큰
export const ORDER_ITEM_REPOSITORY = Symbol('ORDER_ITEM_REPOSITORY');
