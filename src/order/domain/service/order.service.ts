import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Order } from '../entity/order.entity';
import { OrderStatus } from '@prisma/client';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
  OrderFilterOptions,
  OrderPaginationOptions,
  OrderIncludeOptions,
} from '../interface/order.repository.interface';

@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * 새 주문 생성
   */
  async createOrder(params: {
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
  }): Promise<Order> {
    const order = Order.create({
      id: randomUUID(),
      ...params,
    });

    return this.orderRepository.create(order);
  }

  /**
   * 주문 조회 by ID
   */
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

  /**
   * 사용자별 주문 목록 조회
   */
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

  /**
   * 모든 주문 조회 (관리자용)
   */
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

  /**
   * 주문 상태 업데이트
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.updateStatus(status);

    return this.orderRepository.update(order);
  }

  /**
   * 결제 완료 처리
   */
  async markOrderAsPaid(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.markAsPaid();

    return this.orderRepository.update(order);
  }

  /**
   * 주문 취소
   */
  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.cancel();

    return this.orderRepository.update(order);
  }

  /**
   * 배송 시작
   */
  async shipOrder(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.ship();

    return this.orderRepository.update(order);
  }

  /**
   * 배송 완료
   */
  async deliverOrder(orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);

    order.deliver();

    return this.orderRepository.update(order);
  }

  /**
   * 주문 존재 여부 확인
   */
  async checkOrderExists(orderId: string): Promise<boolean> {
    const exists = await this.orderRepository.existsById(orderId);
    if (!exists) {
      throw new NotFoundException(`ID ${orderId}인 주문을 찾을 수 없습니다.`);
    }
    return true;
  }

  /**
   * 사용자별 주문 개수 조회
   */
  async countUserOrders(
    userId: string,
    filterOptions?: OrderFilterOptions,
  ): Promise<number> {
    return this.orderRepository.countByUserId(userId, filterOptions);
  }

  /**
   * 전체 주문 개수 조회
   */
  async countAllOrders(filterOptions?: OrderFilterOptions): Promise<number> {
    return this.orderRepository.countAll(filterOptions);
  }

  /**
   * 주문 권한 검증 (사용자가 자신의 주문인지 확인)
   */
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
}
