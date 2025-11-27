import { Injectable } from '@nestjs/common';
import { Product } from '../domain/entity/product.entity';
import {
  IProductRepository,
  ProductWithDetails,
} from '../domain/interface/product.repository.interface';
import { Role } from '@/modules/user/domain/entity/user.entity';
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

    const priceField = isB2B ? 'wholesale_price' : 'retail_price'; // 가격 필드

    // 쿼리 파라미터
    const params: any[] = [];

    // 기본 쿼리
    let sql = `
      SELECT
        p.id,
        p.name,
        p.${priceField} as price,
        p.description,
        p.image_url as imageUrl,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        c.name as categoryName,
        s.quantity as stockQuantity
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      INNER JOIN stock s ON p.id = s.product_id
      WHERE p.deleted_at IS NULL
    `;

    // 역할에 따른 가격 필터링
    if (isB2B) {
      sql += ` AND p.wholesale_price IS NOT NULL`;
    } else {
      sql += ` AND p.retail_price IS NOT NULL`;
    }

    // 카테고리 필터링
    if (categoryId) {
      sql += ` AND p.category_id = ?`;
      params.push(categoryId);
    }

    // 최신 수정일 기준 정렬
    sql += ` ORDER BY p.updated_at DESC`;

    const products = await this.em.execute<ProductWithDetails[]>(sql, params);

    return products;
  }

  // 상품 상세 조회 (JOIN)
  async findProductWithDetails(
    id: string,
    role?: Role,
  ): Promise<ProductWithDetails | null> {
    const { isB2B } = getRolePermissions(role); // 역할에 따른 B2B 여부 확인

    const priceField = isB2B ? 'wholesale_price' : 'retail_price'; // 가격 필드

    const sql = `
      SELECT
        p.id,
        p.name,
        p.${priceField} as price,
        p.description,
        p.image_url as imageUrl,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        c.name as categoryName,
        s.quantity as stockQuantity
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      INNER JOIN stock s ON p.id = s.product_id
      WHERE p.id = ? AND p.deleted_at IS NULL
      LIMIT 1
    `;

    const results = await this.em.execute<ProductWithDetails[]>(sql, [id]);
    return results[0] || null;
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
}
