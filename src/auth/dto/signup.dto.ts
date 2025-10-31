import { Role } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
const emailRegex = /^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export const SignupSchema = z.object({
  role: z
    .enum(Role, {
      message: '올바른 역할을 선택해주세요.',
    })
    .default(Role.CUSTOMER),
  email: z.string().regex(emailRegex, '올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
  phone: z.string().regex(phoneRegex, '올바른 전화번호 형식이 아닙니다.'),
});

export class SignupDto extends createZodDto(SignupSchema) {}
