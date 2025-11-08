import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    message: '유효하지 않은 주문 상태입니다.',
  }),
});

export class UpdateOrderStatusDto extends createZodDto(UpdateOrderStatusSchema) {}
