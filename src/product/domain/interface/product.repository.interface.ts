import { Role } from '@/user/domain/entity/user.entity';
import { Product } from '../entity/product.entity';

export interface ProductFilterOptions {
  categoryId?: number; // 특정 카테고리의 상품만 조회
  onlyInStock?: boolean; // 재고가 있는 상품만 조회 (stock.quantity > 0)
}

export interface IProductRepository {
  // 상품 존재 여부 확인
  exists(id: string): Promise<boolean>;

  // ID로 상품 조회 (category, stock 기본 포함)
  findOne(id: string, role?: Role): Promise<Product | null>;

  // 모든 상품 조회 (필터 옵션으로 카테고리별 조회 가능, category, stock 기본 포함)
  find(role?: Role, filterOptions?: ProductFilterOptions): Promise<Product[]>;

  // 상품 생성
  create(product: Product): Promise<Product>;

  // 상품 업데이트
  update(product: Product): Promise<Product>;

  // 상품 삭제 (Soft Delete)
  softDelete(productId: string): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
