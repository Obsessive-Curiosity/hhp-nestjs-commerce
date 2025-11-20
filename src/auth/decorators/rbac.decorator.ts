import { Reflector } from '@nestjs/core';
import { Role } from '@/user/domain/entity/user.entity';

export const RBAC = Reflector.createDecorator<Role[]>();
