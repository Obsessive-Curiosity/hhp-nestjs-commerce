import { Injectable } from '@nestjs/common';
import { Product } from '../domain/entity/product.entity';
import {
  IProductRepository,
  ProductWithDetails,
} from '../domain/interface/product.repository.interface';
import { Role } from '@/user/domain/entity/user.entity';
import { getRolePermissions } from '../domain/utils/role-permissions.utils';
import { EntityManager } from '@mikro-orm/mysql';
import { GetProductsFilters } from '../domain/types';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // 상품 존재 여부 확인
  async exists(id: string): Promise<boolean> {
    const count = await this.em.count(Product, {
      id,
      deletedAt: null,
    });

    return count > 0;
  }

  // ID로 상품 엔티티 조회 (수정용)
  async findById(id: string): Promise<Product | null> {
    return await this.em.findOne(Product, {
      id,
      deletedAt: null,
    });
  }

  // 상품 목록 조회 (JOIN)
  async findProductsWithDetails(
    filters?: GetProductsFilters,
    role?: Role,
  ): Promise<ProductWithDetails[]> {
    const { isB2B } = getRolePermissions(role); // 역할에 따른 B2B 여부 확인
    const { categoryId } = filters || {}; // 필터에서 카테고리 ID 추출

    const priceField = isB2B ? 'p.wholesalePrice' : 'p.retailPrice'; // 가격 필드 결정
    const selectFields = this.buildProductSelectFields(priceField); // select 필드 생성

    const qb = this.em
      .createQueryBuilder(Product, 'p')
      .leftJoin('p.category', 'c')
      .leftJoin('p.stock', 's')
      .select(selectFields)
      .where({ 'p.deletedAt': null });

    // 역할에 따른 가격 필터링
    if (isB2B) {
      qb.andWhere({ 'p.wholesalePrice': { $ne: null } });
    } else {
      qb.andWhere({ 'p.retailPrice': { $ne: null } });
    }

    // 카테고리 필터링
    if (categoryId) {
      qb.andWhere({ 'p.categoryId': categoryId });
    }

    // 최신 수정일 기준 정렬
    qb.orderBy({ 'p.updatedAt': 'DESC' });

    const products = await qb.execute<ProductWithDetails[]>('all');

    return products;
  }

  // 상품 상세 조회 (JOIN)
  async findProductWithDetails(
    id: string,
    role?: Role,
  ): Promise<ProductWithDetails | null> {
    const { isB2B } = getRolePermissions(role); // 역할에 따른 B2B 여부 확인

    const priceField = isB2B ? 'p.wholesalePrice' : 'p.retailPrice'; // 가격 필드 결정
    const selectFields = this.buildProductSelectFields(priceField); // select 필드 생성

    const qb = this.em
      .createQueryBuilder(Product, 'p')
      .leftJoin('p.category', 'c')
      .leftJoin('p.stock', 's')
      .select(selectFields)
      .where({ 'p.id': id, 'p.deletedAt': null });

    const product = await qb.execute<ProductWithDetails>('get'); // 단일 결과 조회

    return product;
  }

  // ==================== 생성 (Create) ====================

  // 상품 생성
  async create(product: Product): Promise<Product> {
    await this.em.persistAndFlush(product);
    return product;
  }

  // ==================== 수정 (Update) ====================

  // 상품 수정
  async update(product: Product): Promise<Product> {
    await this.em.flush();
    return product;
  }

  // ==================== 삭제 (Delete) ====================

  // 단일 삭제: Soft Delete (deletedAt 설정)
  async softDelete(productId: string): Promise<void> {
    const product = await this.em.findOne(Product, {
      id: productId,
      deletedAt: null,
    });

    if (product) {
      product.softDelete();
      await this.em.flush();
    }
  }

  // ==================== Private Methods ====================

  // 상품 상세 조회용 select 필드 생성
  private buildProductSelectFields(priceField: string): string[] {
    return [
      'p.id as id',
      'p.name as name',
      `${priceField} as price`,
      'p.description as description',
      'p.imageUrl as imageUrl',
      'p.createdAt as createdAt',
      'p.updatedAt as updatedAt',
      'c.name as categoryName',
      'COALESCE(s.quantity, 0) as stockQuantity',
    ];
  }
}
