import { Injectable } from '@nestjs/common';
import { OrderService } from '@/modules/order/domain/service/order.service';
import { OrderItemService } from '@/modules/order/domain/service/order-item.service';
import { Order } from '@/modules/order/domain/entity/order.entity';

@Injectable()
export class DeleteOrderRollback {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
  ) {}

  // 주문 및 주문 항목 삭제 실행
  async execute(order: Order): Promise<void> {
    // 1. 주문 항목 먼저 삭제 (FK 제약조건)
    await this.orderItemService.deleteMany(order.id);

    // 2. 주문 삭제
    await this.orderService.deleteOrder(order);
  }
}
