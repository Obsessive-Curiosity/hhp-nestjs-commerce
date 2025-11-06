import { Payload } from '@/types/express';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Product } from '../entity/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../interface/product.repository.interface';
import { CreateProductDto, UpdateProductDto } from '@/product/presentation/dto';
import { Role } from '@prisma/client';
import { getRolePermissions } from '../utils/role-permissions.utils';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async createProduct(dto: Omit<CreateProductDto, 'stock'>): Promise<Product> {
    // Domain Entity 생성 (비즈니스 규칙 검증 포함)
    const product = Product.create({
      id: randomUUID(),
      categoryId: dto.categoryId,
      name: dto.name,
      description: dto.description,
      retailPrice: dto.retailPrice ?? null,
      wholesalePrice: dto.wholesalePrice ?? null,
      imageUrl: dto.imageUrl ?? null,
    });

    // Repository를 통해 저장
    const newProduct = await this.productRepository.create(product);

    return newProduct;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    // 기존 상품 조회
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`ID ${id}인 상품을 찾을 수 없습니다.`);
    }

    // Domain Entity 업데이트 (비즈니스 규칙 검증 포함)
    product.updateInfo(dto);

    // Repository를 통해 저장
    return this.productRepository.update(product);
  }

  async findAllProducts(user?: Payload): Promise<Product[]> {
    const { role } = user || {};

    return this.productRepository.findAll(undefined, {
      includeCategory: true,
      includeStock: true,
      userRole: role,
    });
  }

  async findProductById(id: string, user?: Payload): Promise<Product | null> {
    const { role } = user || {};

    const product = await this.productRepository.findById(id, {
      includeCategory: true,
      includeStock: true,
      userRole: role,
    });

    if (!product) {
      throw new NotFoundException(`ID ${id}인 상품을 찾을 수 없습니다.`);
    }

    return product;
  }

  getRolePermissions(userRole?: Role) {
    return getRolePermissions(userRole);
  }

  async checkExistProduct(productId: string) {
    const exists = await this.productRepository.existsById(productId);
    if (!exists) {
      throw new NotFoundException(`ID ${productId}인 상품을 찾을 수 없습니다.`);
    }
    return true;
  }
}
