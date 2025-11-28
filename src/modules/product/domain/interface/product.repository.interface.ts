import { Role } from '@/modules/user/domain/entity/user.entity';
import { Product } from '../entity/product.entity';
import { GetProductsFilters } from '../types';

export interface ProductWithDetails {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  categoryName: string;
  stockQuantity: number;
  hasStock: boolean;
}

export interface IProductRepository {
  // 상품 존재 여부 확인
  exists(id: string): Promise<boolean>;

  // ID로 상품 엔티티 조회 (수정용)
  findById(id: string): Promise<Product | null>;

  // 상품 생성
  create(product: Product): Promise<Product>;

  // 상품 업데이트
  update(product: Product): Promise<Product>;

  // 상품 삭제 (Soft Delete)
  softDelete(productId: string): Promise<void>;

  // 상품 목록 조회 (JOIN, 읽기 최적화)
  findProductsWithDetails(
    filters?: GetProductsFilters,
    role?: Role,
  ): Promise<ProductWithDetails[]>;

  // 상품 상세 조회 (JOIN, 읽기 최적화)
  findProductWithDetails(
    id: string,
    role?: Role,
  ): Promise<ProductWithDetails | null>;
}

// Repository 의존성 주입을 위한 토큰
export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
