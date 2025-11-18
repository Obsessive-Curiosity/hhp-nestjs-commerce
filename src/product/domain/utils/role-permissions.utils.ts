import { Role } from '@/user/domain/entity/user.entity';

export interface RolePermissions {
  isB2C: boolean;
  isB2B: boolean;
}

/**
 * 사용자 역할에 따른 권한을 반환합니다.
 * - B2C: RETAILER, ADMIN 또는 역할 없음
 * - B2B: WHOLESALER, ADMIN
 */
export function getRolePermissions(userRole?: Role): RolePermissions {
  const isB2C =
    !userRole || userRole === Role.RETAILER || userRole === Role.ADMIN;
  const isB2B = userRole === Role.WHOLESALER || userRole === Role.ADMIN;

  return { isB2C, isB2B };
}
