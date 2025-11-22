import { ProductStock } from '@/modules/product/domain/entity/product-stock.entity';

// 재고 정보
export class StockResponseDto {
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;

  static from(stock: ProductStock): StockResponseDto {
    const dto = new StockResponseDto();
    dto.productId = stock.productId;
    dto.quantity = stock.quantity;
    dto.createdAt = stock.createdAt;
    dto.updatedAt = stock.updatedAt;
    return dto;
  }
}

// 재고 증가 응답
export class IncreaseStockResponseDto {
  message: string;
  reason: string | null;

  static from(
    productId: string,
    quantity: number,
    reason?: string,
  ): IncreaseStockResponseDto {
    const dto = new IncreaseStockResponseDto();
    dto.message = `상품 ${productId}의 재고가 ${quantity}개 증가했습니다.`;
    dto.reason = reason ?? null;
    return dto;
  }
}

// 재고 감소 응답
export class DecreaseStockResponseDto {
  message: string;
  reason: string | null;

  static from(
    productId: string,
    quantity: number,
    reason?: string,
  ): DecreaseStockResponseDto {
    const dto = new DecreaseStockResponseDto();
    dto.message = `상품 ${productId}의 재고가 ${quantity}개 감소했습니다.`;
    dto.reason = reason ?? null;
    return dto;
  }
}
