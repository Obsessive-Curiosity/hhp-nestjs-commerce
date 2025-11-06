import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ChargePointSchema = z.object({
  amount: z
    .number()
    .int('충전 금액은 정수여야 합니다.')
    .min(1, '충전 금액은 1원 이상이어야 합니다.')
    .max(1000000000, '충전 금액은 10억원을 초과할 수 없습니다.'),
});

export class ChargePointDto extends createZodDto(ChargePointSchema) {}
