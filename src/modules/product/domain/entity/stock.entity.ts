import { Entity, PrimaryKey, Property, t } from '@mikro-orm/core';
import {
  InvalidInitialStockException,
  InvalidStockQuantityException,
  InsufficientStockException,
} from '../exception';

@Entity()
export class Stock {
  // Product ID (외래 키이자 기본 키)
  @PrimaryKey({ type: t.character, length: 36 })
  productId!: string;

  // 재고 수량
  @Property({ type: t.integer })
  quantity!: number;

  // 재고 생성일
  @Property({ onCreate: () => new Date() })
  createdAt: Date;

  // 재고 수정일
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date;

  // 낙관적 락을 위한 버전
  @Property({ version: true })
  version!: number;

  // =================== Constructor ===================

  protected constructor(data?: Partial<Stock>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  // Factory 메서드: 신규 재고 생성
  static create(initialQuantity: number = 0): Stock {
    if (initialQuantity < 0) {
      throw new InvalidInitialStockException();
    }

    const stock = new Stock();
    stock.quantity = initialQuantity;

    return stock;
  }

  // ======================= 조회 =======================

  // 재고 확인
  hasStock(quantity: number): boolean {
    return this.quantity >= quantity;
  }

  // 재고 부족 확인
  isOutOfStock(): boolean {
    return this.quantity <= 0;
  }

  // ======================= 수정 =======================

  // 재고 감소
  decrease(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidStockQuantityException('decrease');
    }

    if (this.quantity < quantity) {
      throw new InsufficientStockException(this.quantity, quantity);
    }

    this.quantity -= quantity;
  }

  // 재고 증가
  increase(quantity: number): void {
    if (quantity <= 0) {
      throw new InvalidStockQuantityException('increase');
    }

    this.quantity += quantity;
  }
}
