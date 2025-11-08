import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { User as PrismaUser } from '@prisma/client';
import { User } from '../domain/entity/user.entity';
import { IUserRepository } from '../domain/interface/user.repository.interface';
import { assignDirtyFields } from '@/common/utils/repository.utils';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaUser): User {
    return new User({
      id: row.id,
      role: row.role,
      email: row.email,
      password: row.password,
      name: row.name,
      phone: row.phone,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
      lastLoginAt: row.lastLoginAt ?? null,
    });
  }

  // write: Entity → DB
  private fromDomain(user: User): PrismaUser {
    return {
      id: user.id,
      role: user.role,
      email: user.email,
      password: user.password,
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id, deletedAt: null },
    });

    return !!count;
  }

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    return userData ? this.toDomain(userData) : null;
  }

  async save(user: User): Promise<User> {
    const savedUser = await this.prisma.user.create({
      data: this.fromDomain(user),
    });

    return this.toDomain(savedUser);
  }

  async update(user: User): Promise<User> {
    const dirtyFields = user.getDirtyFields();

    // 변경된 필드가 없으면 DB 쿼리 스킵
    if (dirtyFields.size === 0) {
      return user;
    }

    // 변경된 필드만 추출
    const fullData = this.fromDomain(user);
    const updateData: Partial<PrismaUser> = {};

    assignDirtyFields(fullData, updateData, [
      ...dirtyFields,
    ] as (keyof PrismaUser)[]);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    const result = this.toDomain(updatedUser);
    result.clearDirtyFields(); // 업데이트 후 변경 추적 초기화

    return result;
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
