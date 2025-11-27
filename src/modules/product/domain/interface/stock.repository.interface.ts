import { Stock } from '../entity/stock.entity';

export interface IStockRepository {
  // 재고 조회
  findByProductId(productId: string): Promise<Stock | null>;

  // 재고 수량 조회
  getQuantity(productId: string): Promise<number>;

  // 재고 존재 여부 확인
  exists(productId: string): Promise<boolean>;

  // 재고 저장
  save(stock: Stock): Promise<Stock>;

  // 재고 증가
  increase(productId: string, quantity: number): Promise<void>;

  // 재고 감소
  decrease(productId: string, quantity: number): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');
