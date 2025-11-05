import { Product } from '../entity/product.entity';
import { Role } from '@prisma/client';

export interface ProductFilterOptions {
  categoryId?: number;
  onlyInStock?: boolean;
  includeDeleted?: boolean;
}

export interface ProductIncludeOptions {
  includeCategory?: boolean;
  includeStock?: boolean;
  userRole?: Role;
}

export interface IProductRepository {
  // 상품 존재 여부 확인
  existsById(id: string): Promise<boolean>;

  // ID로 상품 조회
  findById(
    id: string,
    options?: ProductIncludeOptions,
  ): Promise<Product | null>;

  // 모든 상품 조회
  findAll(
    filterOptions?: ProductFilterOptions,
    includeOptions?: ProductIncludeOptions,
  ): Promise<Product[]>;

  // 카테고리별 상품 조회
  findByCategoryId(
    categoryId: number,
    includeOptions?: ProductIncludeOptions,
  ): Promise<Product[]>;

  // 상품 생성
  create(product: Product, initialStock?: number): Promise<Product>;

  // 상품 업데이트
  update(product: Product, stockQuantity?: number): Promise<Product>;

  // 상품 삭제 (Soft Delete)
  delete(productId: string): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
