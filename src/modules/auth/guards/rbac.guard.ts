import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@/modules/user/domain/entity/user.entity';
import { Request } from 'express';
import { RBAC } from '../decorators/rbac.decorator';
import { Public } from '../decorators/public.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 0. Public 데코레이터 확인
    const isPublic = this.reflector.getAllAndOverride(Public, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { user } = request;

    // 1. 필요한 역할 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(RBAC, [
      context.getHandler(), // 메서드 레벨 @RBAC()
      context.getClass(), // 클래스 레벨 @RBAC()
    ]);

    // 2. 접근 제어가 명시되지 않은 경우: 기본적으로 접근 허용
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // 3. 사용자 정보가 없으면 접근 거부
    if (!user) return false;

    // 4. 사용자의 역할이 필요한 역할에 포함되는지 확인
    const hasRole = requiredRoles.some((role) => user.role === role);

    return hasRole;
  }
}
