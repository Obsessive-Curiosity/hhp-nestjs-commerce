import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@/user/domain/entity/user.entity';
import { OrderFacade } from '@/order/application/order.facade';
import { UpdateOrderStatusDto } from '../dto';

@RBAC([Role.ADMIN])
@Controller('admin/orders')
export class OrderAdminController {
  constructor(private readonly orderFacade: OrderFacade) {}

  /**
   * 모든 주문 조회 (관리자)
   * GET /admin/orders
   */
  @Get()
  async getAllOrders() {
    return this.orderFacade.getAllOrders();
  }

  /**
   * 주문 상태 변경 (관리자)
   * PATCH /admin/orders/:orderId/status
   */
  @Patch(':orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderFacade.updateOrderStatus(
      orderId,
      updateOrderStatusDto.status,
    );
  }
}
