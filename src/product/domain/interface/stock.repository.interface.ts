import { ProductStock } from '../entity/product-stock.entity';

export interface IStockRepository {
  // 재고 조회
  findByProductId(productId: string): Promise<ProductStock | null>;

  // 재고 생성
  create(stock: ProductStock): Promise<ProductStock>;

  // 재고 생성 (productId 기반)
  createStock(
    productId: string,
    initialQuantity: number,
  ): Promise<ProductStock>;

  // 재고 증가 (Pessimistic Locking - 롤백/반품용)
  increaseWithLock(productId: string, quantity: number): Promise<void>;

  // 재고 감소 (Pessimistic Locking - 주문 차감용)
  decreaseWithLock(productId: string, quantity: number): Promise<void>;

  // 재고 수량 조회
  getQuantity(productId: string): Promise<number>;

  // 재고 존재 여부 확인
  exists(productId: string): Promise<boolean>;
}

// Repository 의존성 주입을 위한 토큰
export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
