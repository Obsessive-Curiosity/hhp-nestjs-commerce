import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RBAC } from '@/modules/auth/decorators/rbac.decorator';
import { UserInfo } from '@/modules/user/presentation/decorators/user-info.decorator';
import { Payload } from '@/common/types/express';
import { Role } from '@/modules/user/domain/entity/user.entity';
import { OrderFacade } from '@/modules/order/application/order.facade';
import { CreateOrderDto } from '../dto';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('orders')
export class OrderController {
  constructor(private readonly orderFacade: OrderFacade) {}

  /**
   * 주문 생성
   * POST /orders
   */
  @Post()
  async createOrder(
    @UserInfo() user: Payload,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const result = await this.orderFacade.createOrder(user, createOrderDto);

    return {
      id: result.order.id,
      status: result.order.status,
      basePrice: result.order.basePrice,
      discountAmount: result.order.discountAmount,
      paymentAmount: result.order.paymentAmount,
      orderItems: result.orderItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        paymentAmount: item.paymentAmount,
      })),
      excludedProducts: result.excludedProducts,
      createdAt: result.order.createdAt,
    };
  }

  /**
   * 주문 목록 조회
   * GET /orders
   */
  @Get()
  async getOrders(@UserInfo() user: Payload) {
    return this.orderFacade.getUserOrders(user.sub);
  }

  /**
   * 주문 상세 조회
   * GET /orders/:orderId
   */
  @Get(':orderId')
  async getOrder(@UserInfo() user: Payload, @Param('orderId') orderId: string) {
    return this.orderFacade.getOrderDetail(orderId, user.sub);
  }

  /**
   * 주문 결제
   * POST /orders/:orderId/payment
   */
  @Post(':orderId/payment')
  async processPayment(
    @UserInfo() user: Payload,
    @Param('orderId') orderId: string,
  ) {
    return this.orderFacade.processPayment(orderId, user.sub);
  }

  /**
   * 주문 취소
   * POST /orders/:orderId/cancel
   */
  @Post(':orderId/cancel')
  async cancelOrder(
    @UserInfo() user: Payload,
    @Param('orderId') orderId: string,
  ) {
    return this.orderFacade.cancelOrder(orderId, user.sub);
  }
}
