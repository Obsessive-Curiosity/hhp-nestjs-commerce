import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateOrderItemSchema = z.object({
  productId: z.string().uuid('올바른 상품 ID 형식이 아닙니다.'),
  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .positive('수량은 1 이상이어야 합니다.'),
});

export const CreateOrderSchema = z.object({
  items: z
    .array(CreateOrderItemSchema)
    .min(1, '최소 1개 이상의 상품을 선택해주세요.'),
  couponIds: z.array(z.string().uuid()).optional(),
  deliveryRequest: z.string().max(500, '배송 요청사항은 최대 500자까지 입력 가능합니다.').optional(),
});

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
