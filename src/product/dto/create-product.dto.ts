import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateProductSchema = z
  .object({
    categoryId: z
      .number()
      .int('카테고리 ID는 정수여야 합니다.')
      .positive('카테고리 ID는 양수여야 합니다.'),

    name: z
      .string()
      .min(1, '상품명을 입력해주세요.')
      .max(100, '상품명은 최대 100자까지 입력 가능합니다.'),

    retailPrice: z
      .number()
      .int('소매가는 정수여야 합니다.')
      .nonnegative('소매가는 0 이상이어야 합니다.')
      .optional(),

    wholesalePrice: z
      .number()
      .int('도매가는 정수여야 합니다.')
      .nonnegative('도매가는 0 이상이어야 합니다.')
      .optional(),

    description: z
      .string()
      .min(1, '상품 설명을 입력해주세요.')
      .max(5000, '상품 설명은 최대 5000자까지 입력 가능합니다.'),

    imageUrl: z.url('올바른 URL 형식이 아닙니다.').optional().nullable(),

    stock: z
      .int('재고는 정수여야 합니다.')
      .nonnegative('재고는 0 이상이어야 합니다.'),
  })
  .superRefine((data, ctx) => {
    if (data.retailPrice === undefined && data.wholesalePrice === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: '소매가 또는 도매가 중 최소 하나는 입력해야 합니다.',
        path: ['retailPrice'],
      });
      ctx.addIssue({
        code: 'custom',
        message: '소매가 또는 도매가 중 최소 하나는 입력해야 합니다.',
        path: ['wholesalePrice'],
      });
    }
  });

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
