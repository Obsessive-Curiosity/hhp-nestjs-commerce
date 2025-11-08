import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateProductCouponSchema = z
  .object({
    name: z
      .string()
      .min(1, '쿠폰명을 입력해주세요.')
      .max(100, '쿠폰명은 최대 100자까지 입력 가능합니다.'),

    // Product 쿠폰은 RATE 타입만 가능
    discountRate: z
      .number()
      .int('할인율은 정수여야 합니다.')
      .min(1, '할인율은 1 이상이어야 합니다.')
      .max(100, '할인율은 100 이하여야 합니다.'),

    maxDiscountAmount: z
      .number()
      .int('최대 할인 금액은 정수여야 합니다.')
      .positive('최대 할인 금액은 양수여야 합니다.')
      .optional()
      .nullable(),

    minPurchaseAmount: z
      .number()
      .int('최소 구매 금액은 정수여야 합니다.')
      .nonnegative('최소 구매 금액은 0 이상이어야 합니다.')
      .optional()
      .nullable(),

    startAt: z.iso
      .date('유효한 날짜 형식이 아닙니다.')
      .transform((val) => new Date(val)),

    endAt: z.iso
      .date('유효한 날짜 형식이 아닙니다.')
      .transform((val) => new Date(val))
      .optional()
      .nullable(),

    validityDays: z
      .number()
      .int('유효 기간은 정수여야 합니다.')
      .positive('유효 기간은 양수여야 합니다.')
      .optional()
      .nullable(),

    totalQuantity: z
      .number()
      .int('발급 수량은 정수여야 합니다.')
      .positive('발급 수량은 양수여야 합니다.')
      .optional()
      .nullable(), // null = 무제한

    // Product 쿠폰은 productId 필수
    productId: z.uuid(),
  })
  .superRefine((data, ctx) => {
    // 유효 기간 정책 검증
    if (!data.endAt && !data.validityDays) {
      ctx.addIssue({
        code: 'custom',
        message: '종료일 또는 유효 기간 중 하나는 필수입니다.',
        path: ['endAt'],
      });
      ctx.addIssue({
        code: 'custom',
        message: '종료일 또는 유효 기간 중 하나는 필수입니다.',
        path: ['validityDays'],
      });
    }
  });

export class CreateProductCouponDto extends createZodDto(
  CreateProductCouponSchema,
) {}
