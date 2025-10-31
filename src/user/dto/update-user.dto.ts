import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;

export const UpdateUserSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  phone: z.string().regex(phoneRegex, '올바른 전화번호 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
