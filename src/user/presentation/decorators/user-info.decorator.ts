import { Public } from '@/auth/decorators/public.decorator';
import { UnauthorizedErrorCode } from '@/auth/constants/error-responses.constant';
import { UnauthorizedException } from '@/auth/exceptions/unauthorized.exception';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request as Req } from 'express';

const reflector = new Reflector();

export const UserInfo = createParamDecorator(
  (_: unknown, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<Req>();
    const { user } = req;

    // Public decorator 확인
    const isPublic = reflector.getAllAndOverride(Public, [
      context.getHandler(),
      context.getClass(),
    ]);

    // user가 있으면 바로 반환
    if (user && user.sub) {
      return user;
    }

    if (isPublic) {
      return undefined; // public이고 user가 없으면 undefined 반환
    }

    // 토큰이 없거나 유효하지 않아서 user가 없는 상태
    throw new UnauthorizedException(UnauthorizedErrorCode.TOKEN_NOT_FOUND);
  },
);
