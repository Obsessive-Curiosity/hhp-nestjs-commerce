import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';

@Entity()
@Unique({ name: 'uq_category_name', properties: ['name'] })
export class Category {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property({ unique: true })
  name!: string;

  @Property({ default: true })
  active: boolean = true;

  @Property({ onCreate: () => new Date() })
  createdAt: Date;

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date;

  // =================== Constructor ===================

  protected constructor(data?: Partial<Category>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  // 카테고리 생성
  static create(name: string, active: boolean = true): Category {
    const category = new Category();

    category.name = name;
    category.active = active;

    return category;
  }

  // ======================= 조회 =======================

  // 상태 확인
  isActive(): boolean {
    return this.active;
  }

  // ======================= 수정 =======================

  // 카테고리 정보 수정
  updateInfo(name?: string, active?: boolean): void {
    if (name !== undefined) {
      this.name = name;
    }

    if (active !== undefined) {
      this.active = active;
    }
  }

  // 카테고리 활성화
  activate(): void {
    if (this.active) {
      throw new BadRequestException('이미 활성화된 카테고리입니다.');
    }
    this.active = true;
  }

  // 카테고리 비활성화
  deactivate(): void {
    if (!this.active) {
      throw new BadRequestException('이미 비활성화된 카테고리입니다.');
    }
    this.active = false;
  }
}
