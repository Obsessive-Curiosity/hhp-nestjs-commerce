import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../entity/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
  ProductWithDetails,
} from '../interface/product.repository.interface';
import {
  CreateProductProps,
  GetProductsFilters,
  UpdateProductProps,
} from '../types';
import { Role } from '@/modules/user/domain/entity/user.entity';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  async findProductsWithDetails(
    filters?: GetProductsFilters,
    role?: Role,
  ): Promise<ProductWithDetails[]> {
    const products = await this.productRepository.findProductsWithDetails(
      filters,
      role,
    );

    return products.map((product) => ({
      ...product,
      hasStock: product.stockQuantity > 0,
    }));
  }

  async findProductWithDetails(
    id: string,
    role?: Role,
  ): Promise<ProductWithDetails | null> {
    const product = await this.productRepository.findProductWithDetails(
      id,
      role,
    );

    if (!product) return null;

    return {
      ...product,
      hasStock: product.stockQuantity > 0,
    };
  }

  // 상품 존재 여부 확인
  async checkExistProduct(productId: string) {
    const exists = await this.productRepository.exists(productId);
    if (!exists) {
      throw new NotFoundException(`ID ${productId}인 상품을 찾을 수 없습니다.`);
    }
    return true;
  }

  // ==================== 생성 (Create) ====================

  // 상품 생성
  async createProduct(props: CreateProductProps): Promise<Product> {
    // Domain Entity 생성 (비즈니스 규칙 검증 포함)
    const product = Product.create(props);

    // Repository를 통해 저장
    const newProduct = await this.productRepository.create(product);

    return newProduct;
  }

  // ==================== 수정 (Update) ====================

  // 상품 정보 수정
  async updateProduct(id: string, props: UpdateProductProps): Promise<Product> {
    // 기존 상품 조회
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException(`ID ${id}인 상품을 찾을 수 없습니다.`);
    }

    // Domain Entity 업데이트 (비즈니스 규칙 검증 포함)
    product.updateInfo(props);

    // Repository를 통해 저장
    return await this.productRepository.update(product);
  }
}
