import { Injectable } from '@nestjs/common';
import { ProductService } from '../domain/service/product.service';
import { PromotionService } from '../domain/service/promotion.service';
import { StockService } from '../domain/service/stock.service';
import {
  UpdateProductProps,
  CreatePromotionsProps,
  GetProductsFilters,
} from '../domain/types';
import { Payload } from '@/types/express';
import {
  ProductListItemResponseDto,
  ProductDetailResponseDto,
  UpdateProductResponseDto,
  PromotionResponseDto,
  DeletePromotionResponseDto,
  IncreaseStockResponseDto,
  DecreaseStockResponseDto,
} from './dto';

@Injectable()
export class ProductFacade {
  constructor(
    private readonly productService: ProductService,
    private readonly stockService: StockService,
    private readonly promotionService: PromotionService,
  ) {}

  // ==================== 조회 ====================

  // 상품 목록 조회
  async getProducts(
    filters?: GetProductsFilters,
    user?: Payload,
  ): Promise<ProductListItemResponseDto[]> {
    const { role } = user || {};
    const products = await this.productService.findProducts(filters, role);

    return products.map((product) =>
      ProductListItemResponseDto.from(product, role),
    );
  }

  // 상품 상세 조회
  async getProduct(
    id: string,
    user?: Payload,
  ): Promise<ProductDetailResponseDto | null> {
    const { role } = user || {};
    const product = await this.productService.findProduct(id, role);

    if (!product) {
      return null;
    }

    return ProductDetailResponseDto.from(product, role);
  }

  // 활성 프로모션 조회
  async getActivePromotions(
    productId: string,
  ): Promise<PromotionResponseDto[]> {
    const promotions =
      await this.promotionService.getActivePromotions(productId);

    return promotions.map((promotion) => PromotionResponseDto.from(promotion));
  }

  // ==================== 생성 ====================

  // 프로모션 생성
  async createPromotions(
    productId: string,
    props: CreatePromotionsProps,
  ): Promise<PromotionResponseDto[]> {
    const promotions = await this.promotionService.createPromotions(
      productId,
      props,
    );

    return promotions.map((promotion) =>
      PromotionResponseDto.from(promotion, true),
    );
  }

  // ==================== 수정 ====================

  // 상품 수정
  async updateProduct(
    id: string,
    props: UpdateProductProps,
  ): Promise<UpdateProductResponseDto> {
    const product = await this.productService.updateProduct(id, props);

    return UpdateProductResponseDto.from(product);
  }

  // 재고 증가
  async increaseStock(
    productId: string,
    quantity: number,
    reason?: string,
  ): Promise<IncreaseStockResponseDto> {
    await this.stockService.increaseStock(productId, quantity);

    return IncreaseStockResponseDto.from(productId, quantity, reason);
  }

  // 재고 감소
  async decreaseStock(
    productId: string,
    quantity: number,
    reason?: string,
  ): Promise<DecreaseStockResponseDto> {
    await this.stockService.decreaseStock(productId, quantity);

    return DecreaseStockResponseDto.from(productId, quantity, reason);
  }

  // ==================== 삭제 ====================

  // 프로모션 삭제
  async deletePromotion(id: string): Promise<DeletePromotionResponseDto> {
    await this.promotionService.delete(id);

    return DeletePromotionResponseDto.from();
  }
}
