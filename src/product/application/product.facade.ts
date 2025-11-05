import { Injectable } from '@nestjs/common';
import { Payload } from '@/types/express';
import { ProductService } from '../domain/service/product.service';
import { PromotionService } from '../domain/service/promotion.service';
import { StockService } from '../domain/service/stock.service';
import { CreateProductDto } from '../presentation/dto/create-product.dto';
import { UpdateProductDto } from '../presentation/dto/update-product.dto';
import { CreatePromotionsDto } from '../presentation/dto/create-promotion.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class ProductFacadeService {
  constructor(
    private readonly productService: ProductService,
    private readonly stockService: StockService,
    private readonly promotionService: PromotionService,
    private readonly prisma: PrismaService,
  ) {}

  // 상품 생성 (관리자)
  async createProduct(dto: CreateProductDto) {
    return this.prisma.$transaction(async () => {
      const { stock, ...rest } = dto;

      // 1. Product 생성
      const product = await this.productService.createProduct(rest);

      // 2. Stock 생성
      await this.stockService.createStock(product.id, stock);

      return {
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        description: product.description,
        imageUrl: product.imageUrl,
        createdAt: product.createdAt,
      };
    });
  }

  // 상품 수정 (관리자)
  async updateProduct(id: string, dto: UpdateProductDto) {
    // Product 정보만 수정 (재고는 별도 API로 관리)
    const product = await this.productService.updateProduct(id, dto);

    return {
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      description: product.description,
      imageUrl: product.imageUrl,
      updatedAt: product.updatedAt,
    };
  }

  // 재고 증가 (관리자 - 입고)
  async increaseStock(productId: string, quantity: number, reason?: string) {
    await this.stockService.increaseStock(productId, quantity);

    return {
      message: `상품 ${productId}의 재고가 ${quantity}개 증가했습니다.`,
      reason,
    };
  }

  // 재고 감소 (관리자 - 폐기/분실 등)
  async decreaseStock(productId: string, quantity: number, reason?: string) {
    await this.stockService.decreaseStock(productId, quantity);

    return {
      message: `상품 ${productId}의 재고가 ${quantity}개 감소했습니다.`,
      reason,
    };
  }

  // 상품 목록 조회
  async getProducts(user?: Payload) {
    const products = await this.productService.findAllProducts(user);

    return products.map((product) => ({
      id: product.id,
      categoryId: product.categoryId,
      category: product.category,
      name: product.name,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      description: product.description,
      imageUrl: product.imageUrl,
      stock: product.stock,
    }));
  }

  // 상품 상세 조회
  async getProduct(id: string, user?: Payload) {
    const product = await this.productService.findProductById(id, user);

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      categoryId: product.categoryId,
      category: product.category,
      name: product.name,
      retailPrice: product.retailPrice,
      wholesalePrice: product.wholesalePrice,
      description: product.description,
      imageUrl: product.imageUrl,
      stock: product.stock,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  // 프로모션 생성 (관리자)
  async createPromotions(productId: string, dto: CreatePromotionsDto) {
    const promotions = await this.promotionService.create(productId, dto);

    return promotions.map((promotion) => ({
      id: promotion.id,
      productId: promotion.productId,
      paidQuantity: promotion.paidQuantity,
      freeQuantity: promotion.freeQuantity,
      format: promotion.getPromotionFormat(),
      startAt: promotion.startAt,
      endAt: promotion.endAt,
      createdAt: promotion.createdAt,
    }));
  }

  // 프로모션 삭제 (관리자)
  async deletePromotion(id: string) {
    await this.promotionService.delete(id);

    return {
      message: '프로모션이 삭제되었습니다.',
    };
  }

  // 상품의 활성 프로모션 조회
  async getActivePromotion(productId: string) {
    const promotion = await this.promotionService.getActivePromotion(productId);

    if (!promotion) {
      return null;
    }

    return {
      id: promotion.id,
      productId: promotion.productId,
      paidQuantity: promotion.paidQuantity,
      freeQuantity: promotion.freeQuantity,
      format: promotion.getPromotionFormat(),
      startAt: promotion.startAt,
      endAt: promotion.endAt,
    };
  }
}
