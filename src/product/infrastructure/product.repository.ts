import { Injectable } from '@nestjs/common';
import { Product } from '../domain/entity/product.entity';
import {
  IProductRepository,
  ProductFilterOptions,
} from '../domain/interface/product.repository.interface';
import { Role } from '@/user/domain/entity/user.entity';
import { getRolePermissions } from '../domain/utils/role-permissions.utils';
import { EntityManager } from '@mikro-orm/mysql';

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

  // 상품 단일 조회
  async findOne(id: string, role?: Role): Promise<Product | null> {
    const { isB2B } = getRolePermissions(role);

    // 0. 사용자별 조회 필드 구성
    const alias = 'p';
    const fields = this.buildProductFields(alias, isB2B);

    // 1. QueryBuilder 시작
    const qb = this.em
      .createQueryBuilder(Product, alias)
      .select(fields)
      .where({ id, deletedAt: null });

    return await qb.getSingleResult();
  }

  // 상품 목록 조회
  async find(role?: Role, filter?: ProductFilterOptions): Promise<Product[]> {
    const { isB2B } = getRolePermissions(role);
    const { categoryId } = filter || {};

    // 0. 사용자별 조회 필드 구성
    const alias = 'p';
    const fields = this.buildProductFields(alias, isB2B);

    // 1. QueryBuilder 시작
    const qb = this.em
      .createQueryBuilder(Product, alias)
      .select(fields)
      .where({ deletedAt: null })
      .orderBy({ updatedAt: 'DESC' });

    // 2. 사용자 역할별 가격 필터
    if (isB2B) {
      qb.andWhere({ wholesalePrice: { $ne: null } });
    } else {
      qb.andWhere({ retailPrice: { $ne: null } });
    }

    // 3. 카테고리 필터
    if (categoryId) {
      qb.andWhere({ categoryId });
    }

    return await qb.getResultList();
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

  // 사용자 역할별 상품 조회 필드를 구성
  private buildProductFields(alias: string, isB2B: boolean): string[] {
    // 사용자 역할별 가격 필드 선택
    const priceField = isB2B
      ? `${alias}.wholesalePrice`
      : `${alias}.retailPrice`;

    return [
      `${alias}.id`,
      `${alias}.name`,
      `${alias}.imageUrl`,
      `${alias}.categoryId`,
      `${alias}.updatedAt`,
      `${priceField} as price`,
    ];
  }
}
