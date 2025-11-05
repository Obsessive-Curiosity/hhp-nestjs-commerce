import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Product as PrismaProduct } from '@prisma/client';
import { Product } from '../domain/entity/product.entity';
import {
  IProductRepository,
  ProductFilterOptions,
  ProductIncludeOptions,
} from '../domain/interface/product.repository.interface';
import { assignDirtyFields } from '@/common/utils/repository.utils';
import { ProductService } from '../domain/service/product.service';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
  ) {}

  // read: DB → Entity
  private toDomain(row: PrismaProduct): Product {
    return new Product({
      id: row.id,
      categoryId: row.categoryId,
      name: row.name,
      retailPrice: row.retailPrice,
      wholesalePrice: row.wholesalePrice,
      description: row.description,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? null,
    });
  }

  // write: Entity → DB
  private fromDomain(product: Product) {
    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      description: product.description,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      deletedAt: product.deletedAt ?? null,
    };
  }

  // Include 옵션을 Prisma include로 변환
  private buildIncludeOptions(options?: ProductIncludeOptions) {
    if (!options) return undefined;

    const { userRole, includeCategory, includeStock } = options;
    const { isB2C, isB2B } = this.productService.getRolePermissions(userRole);

    return {
      category: includeCategory ?? false,
      stock: includeStock ?? false,
      promotions: isB2B ? true : false,
      coupons: isB2C
        ? {
            include: {
              coupon: true,
            },
          }
        : false,
    };
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { id, deletedAt: null },
    });

    return count > 0;
  }

  async findById(
    id: string,
    options?: ProductIncludeOptions,
  ): Promise<Product | null> {
    const productData = await this.prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: this.buildIncludeOptions(options),
    });

    return productData ? this.toDomain(productData) : null;
  }

  async findAll(
    filterOptions?: ProductFilterOptions,
    includeOptions?: ProductIncludeOptions,
  ): Promise<Product[]> {
    const { categoryId, onlyInStock, includeDeleted } = filterOptions || {};
    const where: {
      categoryId?: number;
      stock?: { quantity: { gt: number } };
      deletedAt?: Date | null;
    } = {};

    // 필터 조건 적용
    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (onlyInStock) {
      where.stock = {
        quantity: {
          gt: 0,
        },
      };
    }

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: this.buildIncludeOptions(includeOptions),
    });

    return products.map((p) => this.toDomain(p));
  }

  async findByCategoryId(
    categoryId: number,
    includeOptions?: ProductIncludeOptions,
  ): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { categoryId, deletedAt: null },
      include: this.buildIncludeOptions(includeOptions),
    });

    return products.map((p) => this.toDomain(p));
  }

  async create(product: Product): Promise<Product> {
    const data = this.fromDomain(product);

    const newProduct = await this.prisma.product.create({
      data,
    });

    return this.toDomain(newProduct);
  }

  async update(product: Product): Promise<Product> {
    const dirtyFields = product.getDirtyFields();

    // 변경된 필드가 없으면 스킵
    if (dirtyFields.size === 0) {
      return product;
    }

    // 변경된 필드만 추출
    const fullData = this.fromDomain(product);
    const updateData: Partial<PrismaProduct> = {};

    assignDirtyFields(fullData, updateData, [
      ...dirtyFields,
    ] as (keyof PrismaProduct)[]);

    const updatedProduct = await this.prisma.product.update({
      where: { id: product.id },
      data: updateData,
      include: {
        category: true,
        stock: true,
      },
    });

    const result = this.toDomain(updatedProduct);
    result.clearDirtyFields();

    return result;
  }

  async delete(productId: string): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
