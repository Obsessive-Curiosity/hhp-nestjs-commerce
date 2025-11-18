import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../entity/product.entity';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../interface/product.repository.interface';
import {
  CreateProductProps,
  GetProductsFilters,
  UpdateProductProps,
} from '../types';
import { Role } from '@/user/domain/entity/user.entity';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 상품 목록 조회
  async findProducts(
    filters?: GetProductsFilters,
    role?: Role,
  ): Promise<Product[]> {
    return await this.productRepository.find(role, filters);
  }

  // 상품 조회 by ID
  async findProduct(id: string, role?: Role): Promise<Product | null> {
    const product = await this.productRepository.findOne(id, role);
    if (!product) {
      throw new NotFoundException(`ID ${id}인 상품을 찾을 수 없습니다.`);
    }

    return product;
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
    // 기존 상품 조회 (관리자 작업이므로 role 없이 전체 데이터 조회)
    const product = await this.productRepository.findOne(id, Role.ADMIN);

    if (!product) {
      throw new NotFoundException(`ID ${id}인 상품을 찾을 수 없습니다.`);
    }

    // Domain Entity 업데이트 (비즈니스 규칙 검증 포함)
    product.updateInfo(props);

    // Repository를 통해 저장
    return await this.productRepository.update(product);
  }
}
