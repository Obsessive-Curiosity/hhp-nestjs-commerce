import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('수량은 정수여야 합니다.')
    .min(1, '수량은 1개 이상이어야 합니다.'),
});

export class UpdateCartItemDto extends createZodDto(UpdateCartItemSchema) {}
