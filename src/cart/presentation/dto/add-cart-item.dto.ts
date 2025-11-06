import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddCartItemSchema = z.object({
  productId: z.uuid('올바른 상품 ID 형식이 아닙니다.'),

  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .min(1, '수량은 1개 이상이어야 합니다.'),
});

export class AddCartItemDto extends createZodDto(AddCartItemSchema) {}
