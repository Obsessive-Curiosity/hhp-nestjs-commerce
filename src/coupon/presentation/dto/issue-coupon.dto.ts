import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const IssueCouponSchema = z.object({
  couponId: z.uuid('유효한 쿠폰 ID가 아닙니다.'),
});

export class IssueCouponDto extends createZodDto(IssueCouponSchema) {}
