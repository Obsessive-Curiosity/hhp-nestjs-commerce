import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const validateDateRange = (
  startAt?: Date | null,
  endAt?: Date | null,
) => {
  if (startAt && endAt) {
    return startAt <= endAt;
  }
  return true;
};

const PromotionItemSchema = z
  .object({
    paidQuantity: z
      .number()
      .int('유료 수량은 정수여야 합니다.')
      .min(1, '유료 수량은 1 이상이어야 합니다.'),

    freeQuantity: z
      .number()
      .int('무료 수량은 정수여야 합니다.')
      .min(1, '무료 수량은 1 이상이어야 합니다.'),

    startAt: z.iso
      .date({ message: '유효한 날짜 형식이어야 합니다. (예: 2025-11-05)' })
      .transform((val) => new Date(val))
      .optional(),

    endAt: z.iso
      .date({ message: '유효한 날짜 형식이어야 합니다. (예: 2025-12-31)' })
      .transform((val) => new Date(val))
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      validateDateRange(data.startAt, data.endAt);
    },
    {
      message: '종료일은 시작일 이후이거나 같아야 합니다.',
      path: ['endAt'],
    },
  );

// 배열 스키마
export const CreatePromotionsSchema = z
  .array(PromotionItemSchema)
  .min(1, '최소 1개 이상의 프로모션을 입력해야 합니다.');

export class CreatePromotionsDto extends createZodDto(CreatePromotionsSchema) {}
