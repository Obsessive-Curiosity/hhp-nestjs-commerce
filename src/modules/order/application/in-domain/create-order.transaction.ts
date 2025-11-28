import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/core';
import { OrderService } from '@/modules/order/domain/service/order.service';
import { OrderItemService } from '@/modules/order/domain/service/order-item.service';
import { CreateOrderProps } from '@/modules/order/domain/types';

export interface CreateOrderParams {
  orderData: CreateOrderProps;
  orderItems: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    paymentAmount: number;
  }>;
}

@Injectable()
export class CreateOrderTransaction {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
  ) {}

  @Transactional()
  async execute(params: CreateOrderParams) {
    const { orderData, orderItems } = params;

    // 2-1. 주문 생성
    const order = await this.orderService.createOrder(orderData);

    // 2-2. 주문 항목 생성
    const orderItemParams = orderItems.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      paymentAmount: item.paymentAmount,
    }));

    const createdOrderItems =
      await this.orderItemService.createOrderItems(orderItemParams);

    return {
      order,
      orderItems: createdOrderItems,
    };
  }
}
