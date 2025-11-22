import { IsEnum } from 'class-validator';
import { OrderStatus } from '@/modules/order/domain/entity/order.entity';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: '유효하지 않은 주문 상태입니다.' })
  status: OrderStatus;
}
