import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Category } from '../domain/entity/category.entity';
import { ICategoryRepository } from '../domain/interface/category.repository.interface';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // ID로 카테고리 존재 여부 확인
  async existsById(id: number): Promise<boolean> {
    const count = await this.em.count(Category, { id });
    return count > 0;
  }

  // ID로 카테고리 조회
  async findById(id: number): Promise<Category | null> {
    return await this.em.findOne(Category, { id });
  }

  // 이름으로 카테고리 조회
  async findByName(name: string): Promise<Category | null> {
    return await this.em.findOne(Category, { name });
  }

  // 활성화된 카테고리 목록 조회
  async findActive(): Promise<Category[]> {
    return await this.em.find(
      Category,
      { active: true },
      { orderBy: { name: 'asc' } },
    );
  }

  // 모든 카테고리 조회
  async findAll(): Promise<Category[]> {
    return await this.em.find(Category, {}, { orderBy: { name: 'asc' } });
  }

  // ==================== 생성 (Create) ====================

  // 카테고리 생성
  async create(category: Category): Promise<Category> {
    await this.em.persistAndFlush(category);
    return category;
  }

  // ==================== 수정 (Update) ====================

  // 카테고리 수정
  async update(category: Category): Promise<Category> {
    await this.em.flush();
    return category;
  }

  // ==================== 삭제 (Delete) ====================

  // 카테고리 삭제
  async delete(id: number): Promise<void> {
    const category = await this.em.findOne(Category, { id });
    if (category) {
      await this.em.removeAndFlush(category);
    }
  }
}
