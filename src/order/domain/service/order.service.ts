import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Order, OrderStatus } from '../entity/order.entity';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
  OrderFilterOptions,
  OrderPaginationOptions,
  OrderIncludeOptions,
} from '../interface/order.repository.interface';
import { CreateOrderProps } from '../types';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 주문 조회 by ID
  async findOrderById(
    orderId: string,
    options?: OrderIncludeOptions,
  ): Promise<Order> {
    const order = await this.orderRepository.findById(orderId, options);

    if (!order) {
      throw new NotFoundException(`ID ${orderId}인 주문을 찾을 수 없습니다.`);
    }

    return order;
  }

  // 사용자별 주문 목록 조회
  async findUserOrders(
    userId: string,
    filterOptions?: OrderFilterOptions,
    paginationOptions?: OrderPaginationOptions,
    includeOptions?: OrderIncludeOptions,
  ): Promise<Order[]> {
    return this.orderRepository.findByUserId(
      userId,
      filterOptions,
      paginationOptions,
      includeOptions,
    );
  }

  // 모든 주문 조회 (관리자용)
  async findAllOrders(
    filterOptions?: OrderFilterOptions,
    paginationOptions?: OrderPaginationOptions,
    includeOptions?: OrderIncludeOptions,
  ): Promise<Order[]> {
    return this.orderRepository.findAll(
      filterOptions,
      paginationOptions,
      includeOptions,
    );
  }

  // 주문 존재 여부 확인
  async checkOrderExists(orderId: string): Promise<boolean> {
    const exists = await this.orderRepository.existsById(orderId);
    if (!exists) {
      throw new NotFoundException(`ID ${orderId}인 주문을 찾을 수 없습니다.`);
    }
    return true;
  }

  // 사용자별 주문 개수 조회
  async countUserOrders(
    userId: string,
    filterOptions?: OrderFilterOptions,
  ): Promise<number> {
    return this.orderRepository.countByUserId(userId, filterOptions);
  }

  // 전체 주문 개수 조회
  async countAllOrders(filterOptions?: OrderFilterOptions): Promise<number> {
    return this.orderRepository.countAll(filterOptions);
  }

  // 주문 권한 검증 (사용자가 자신의 주문인지 확인)
  async validateOrderOwnership(
    orderId: string,
    userId: string,
  ): Promise<Order> {
    const order = await this.findOrderById(orderId);

    if (order.userId !== userId) {
      throw new BadRequestException('본인의 주문만 조회/수정할 수 있습니다.');
    }

    return order;
  }

  // ==================== 생성 (Create) ====================

  // 새 주문 생성
  async createOrder(props: CreateOrderProps): Promise<Order> {
    const order = Order.create(props);

    return this.orderRepository.create(order);
  }

  // ==================== 수정 (Update) ====================

  // 주문 상태 업데이트
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.updateStatus(status);

    return this.orderRepository.update(order);
  }

  // 결제 완료 처리
  async markOrderAsPaid(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.markAsPaid();

    return this.orderRepository.update(order);
  }

  // 주문 취소
  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.cancel();

    return this.orderRepository.update(order);
  }

  // 배송 시작
  async shipOrder(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.ship();

    return this.orderRepository.update(order);
  }

  // 배송 완료
  async deliverOrder(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.deliver();

    return this.orderRepository.update(order);
  }

  // ==================== 정책 (Policy) ====================

  /**
   * 재고 부족 상품 자동 제외 정책
   *
   * BR-021: 재고 부족 상품 자동 제외 (사용자 설정에 따라)
   * FR-014: 재고 부족 시 전체 실패 또는 자동 제외 옵션
   *
   * @param items - 주문하려는 상품 목록
   * @param stockChecks - 각 상품의 재고 확인 결과
   * @returns 재고가 있는 상품 목록과 제외된 상품 ID 목록
   */
  excludeOutOfStockItems<T extends { productId: string; quantity: number }>(
    items: T[],
    stockChecks: Array<{ productId: string; hasStock: boolean }>,
  ): { includedItems: T[]; excludedProductIds: string[] } {
    const stockMap = new Map<string, boolean>(
      stockChecks.map((check) => [check.productId, check.hasStock]),
    );

    const includedItems: T[] = [];
    const excludedProductIds: string[] = [];

    for (const item of items) {
      const hasStock = stockMap.get(item.productId);

      if (hasStock === true) {
        includedItems.push(item);
      } else {
        excludedProductIds.push(item.productId);
      }
    }

    return {
      includedItems,
      excludedProductIds,
    };
  }
}
