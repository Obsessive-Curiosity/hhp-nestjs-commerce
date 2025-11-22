import { Injectable } from '@nestjs/common';
import { OrderStatus } from '../domain/entity/order.entity';
import { OrderService } from '../domain/service/order.service';
import { OrderItemService } from '../domain/service/order-item.service';
import { ProcessPaymentUseCase } from './cross-domain/process-payment.usecase';
import { CreateOrderDto } from '../presentation/dto';
import { Payload } from '@/common/types/express';

@Injectable()
export class OrderFacade {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
    private readonly processPaymentUseCase: ProcessPaymentUseCase,
  ) {}

  /**
   * 주문 생성 및 결제 처리
   */
  async processPayment(user: Payload, dto: CreateOrderDto) {
    return await this.processPaymentUseCase.execute(user, dto);
  }

  /**
   * 주문 목록 조회 (사용자)
   */
  async getUserOrders(userId: string) {
    const orders = await this.orderService.findUserOrders(userId);

    return { orders };
  }

  /**
   * 주문 상세 조회
   */
  async getOrderDetail(orderId: string, userId: string) {
    const order = await this.orderService.validateOrderOwnership(
      orderId,
      userId,
    );
    const orderItems =
      await this.orderItemService.findOrderItemsByOrderId(orderId);

    return {
      order,
      orderItems,
    };
  }

  /**
   * 모든 주문 조회 (관리자)
   */
  async getAllOrders() {
    const orders = await this.orderService.findAllOrders();

    return { orders };
  }

  /**
   * 주문 상태 변경 (관리자)
   */
  async updateOrderStatus(orderId: string, status: string) {
    // TODO: status string을 OrderStatus enum으로 변환 및 검증
    return this.orderService.updateOrderStatus(orderId, status as OrderStatus);
  }

  /**
   * 주문 취소
   */
  async cancelOrder(orderId: string, userId: string) {
    // 주문 권한 검증
    await this.orderService.validateOrderOwnership(orderId, userId);

    // 주문 취소 처리
    return await this.orderService.cancelOrder(orderId);
  }
}
