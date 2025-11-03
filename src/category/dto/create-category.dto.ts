import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, '카테고리 이름을 입력해주세요.')
    .max(50, '카테고리 이름은 최대 50자까지 입력 가능합니다.'),

  active: z.boolean().default(true),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
