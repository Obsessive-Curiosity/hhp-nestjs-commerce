import { Category } from '../entity/category.entity';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  // 카테고리 존재 여부 확인
  existsById(id: number): Promise<boolean>;

  // ID로 카테고리 조회
  findById(id: number): Promise<Category | null>;

  // 이름으로 카테고리 조회
  findByName(name: string): Promise<Category | null>;

  // 활성화된 카테고리 목록 조회
  findActive(): Promise<Category[]>;

  // 전체 카테고리 목록 조회
  findAll(): Promise<Category[]>;

  // 카테고리 생성
  create(category: Category): Promise<Category>;

  // 카테고리 수정
  update(category: Category): Promise<Category>;

  // 카테고리 삭제 (Hard Delete)
  delete(id: number): Promise<void>;
}
