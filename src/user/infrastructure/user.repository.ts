import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { User } from '../domain/entity/user.entity';
import { IUserRepository } from '../domain/interface/user.repository.interface';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // ID로 사용자 존재 여부 확인
  async existsById(id: string): Promise<boolean> {
    const count = await this.em.count(User, { id });
    return count > 0;
  }

  // ID로 사용자 조회
  async findById(id: string): Promise<User | null> {
    return await this.em.findOne(User, { id });
  }

  // 이메일로 사용자 조회
  async findByEmail(email: string): Promise<User | null> {
    return await this.em.findOne(User, { email });
  }

  // ==================== 생성 (Create) ====================

  // 사용자 생성
  async create(user: User): Promise<User> {
    await this.em.persistAndFlush(user);
    return user;
  }

  // ==================== 수정 (Update) ====================

  // 사용자 정보 수정
  async update(user: User): Promise<User> {
    await this.em.flush();
    return user;
  }

  // ==================== 삭제 (Delete) ====================

  // 단일 삭제: Soft Delete (deletedAt 설정)
  async softDelete(userId: string): Promise<void> {
    const user = await this.em.findOne(User, { id: userId });

    if (user) {
      user.softDelete();
      await this.em.flush();
    }
  }
}
