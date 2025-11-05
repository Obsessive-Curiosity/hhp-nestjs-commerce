import { ProductStock } from '../entity/product-stock.entity';

export interface IStockRepository {
  // 재고 조회
  findByProductId(productId: string): Promise<ProductStock | null>;

  // 재고 생성
  create(stock: ProductStock): Promise<ProductStock>;

  // 재고 증가 (Optimistic Locking)
  increaseWithVersion(
    productId: string,
    quantity: number,
    currentVersion: number,
  ): Promise<void>;

  // 재고 감소 (Optimistic Locking)
  decreaseWithVersion(
    productId: string,
    quantity: number,
    currentVersion: number,
  ): Promise<void>;

  // 재고 수량 조회
  getQuantity(productId: string): Promise<number>;

  // 재고 존재 여부 확인
  exists(productId: string): Promise<boolean>;
}

// Repository 의존성 주입을 위한 토큰
export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
