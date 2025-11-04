import { User } from '../entity/user.entity';

export interface IUserRepository {
  // 사용자 존재 여부 확인
  existsById(id: string): Promise<boolean>;

  // ID로 사용자 조회 (삭제된 사용자 제외)
  findById(id: string): Promise<User | null>;

  // 이메일로 사용자 조회 (삭제된 사용자 제외)
  findByEmail(email: string): Promise<User | null>;

  // 사용자 저장 (생성 또는 업데이트)
  save(user: User): Promise<User>;

  // 사용자 업데이트
  update(user: User): Promise<User>;

  // 사용자 삭제 (Soft Delete)
  delete(userId: string): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
