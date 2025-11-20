import {
  Entity,
  PrimaryKey,
  Property,
  t,
  Index,
  ManyToOne,
  OneToOne,
  Cascade,
} from '@mikro-orm/core';
import { v7 as uuidv7 } from 'uuid';
import { BadRequestException } from '@nestjs/common';
import { Category } from '@/category/domain/entity/category.entity';
import { ProductStock } from './product-stock.entity';

export type CreateProductProps = {
  categoryId: number;
  name: string;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  description: string;
  imageUrl?: string | null;
};

@Entity()
@Index({ name: 'fk_product_categoryId', properties: ['categoryId'] })
export class Product {
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  @Property()
  categoryId!: number;

  @ManyToOne(() => Category, {
    fieldName: 'categoryId', // 외래 키 매핑
    persist: false, // 조회 전용
  })
  category!: Category;

  @OneToOne(() => ProductStock, {
    cascade: [Cascade.REMOVE],
    orphanRemoval: true,
  })
  stock!: ProductStock;

  @Property()
  name!: string;

  // 소매가 (B2C 가격)
  @Property({ type: t.decimal, precision: 15, scale: 2, nullable: true })
  retailPrice!: number | null;

  // 도매가 (B2B 가격)
  @Property({ type: t.decimal, precision: 15, scale: 2, nullable: true })
  wholesalePrice!: number | null;

  // 상품 설명
  @Property({ type: t.text })
  description!: string;

  // 상품 이미지 URL
  @Property({ nullable: true })
  imageUrl: string | null = null;

  // 상품 생성일
  @Property({ onCreate: () => new Date() })
  createdAt: Date;

  // 상품 수정일
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date;

  // 상품 삭제일 (null = 삭제되지 않음, Soft Delete)
  @Property({ nullable: true })
  deletedAt!: Date | null;

  // =================== Constructor ===================

  protected constructor(data?: Partial<Product>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  // Factory 메서드: 신규 상품 생성
  static create(params: CreateProductProps): Product {
    const product = new Product();
    product.categoryId = params.categoryId;
    product.name = params.name;
    product.retailPrice = params.retailPrice ?? null;
    product.wholesalePrice = params.wholesalePrice ?? null;
    product.description = params.description;
    product.imageUrl = params.imageUrl ?? null;

    // BR-006: 가격 검증
    product.validatePricing();

    return product;
  }

  // ======================= 조회 =======================

  // 삭제 여부 확인
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  // 활성 상품 확인
  isActive(): boolean {
    return !this.isDeleted();
  }

  // ======================= 수정 =======================

  // 상품 정보 업데이트
  updateInfo(params: {
    name?: string;
    categoryId?: number;
    retailPrice?: number | null;
    wholesalePrice?: number | null;
    description?: string;
    imageUrl?: string | null;
  }): void {
    if (this.isDeleted()) {
      throw new BadRequestException('삭제된 상품은 수정할 수 없습니다.');
    }

    if (params.name) {
      this.name = params.name;
    }
    if (params.categoryId) {
      this.categoryId = params.categoryId;
    }
    if (params.retailPrice) {
      this.retailPrice = params.retailPrice;
    }
    if (params.wholesalePrice) {
      this.wholesalePrice = params.wholesalePrice;
    }
    if (params.description) {
      this.description = params.description;
    }
    if (params.imageUrl) {
      this.imageUrl = params.imageUrl;
    }

    // 가격 검증
    this.validatePricing();
  }

  // ======================= 삭제 =======================

  // Soft Delete
  softDelete(): void {
    if (this.isDeleted()) {
      throw new BadRequestException('이미 삭제된 상품입니다.');
    }
    this.deletedAt = new Date();
  }

  // ======================= 검증 =======================

  // BR-006: B2B 가격은 B2C보다 낮아야 함
  private validatePricing(): void {
    // 소매가 또는 도매가 중 최소 하나는 있어야 함
    if (this.retailPrice === null && this.wholesalePrice === null) {
      throw new BadRequestException(
        '소매가 또는 도매가 중 최소 하나는 입력해야 합니다.',
      );
    }

    // 둘 다 있을 경우, 도매가가 소매가보다 낮아야 함
    if (this.retailPrice !== null && this.wholesalePrice !== null) {
      if (this.wholesalePrice >= this.retailPrice) {
        throw new BadRequestException(
          'B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.',
        );
      }
    }
  }
}
