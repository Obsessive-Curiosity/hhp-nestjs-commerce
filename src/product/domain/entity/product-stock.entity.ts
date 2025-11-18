import { Entity, PrimaryKey, Property, OneToOne, t } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { Product } from './product.entity';

@Entity()
export class ProductStock {
  // Product 엔티티를 참조 (1:1 관계)
  @PrimaryKey({ type: t.character, length: 36 })
  productId!: string;

  @OneToOne(() => Product, { owner: true, primary: true })
  product!: Product;

  // 재고 수량
  @Property({ type: t.integer })
  quantity!: number;

  // 재고 생성일
  @Property({ onCreate: () => new Date() })
  createdAt: Date;

  // 재고 수정일
  @Property({ onUpdate: () => new Date() })
  updatedAt: Date;

  // 낙관적 락을 위한 버전
  @Property({ version: true })
  version!: number;

  // =================== Constructor ===================

  protected constructor(data?: Partial<ProductStock>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  // Factory 메서드: 신규 재고 생성
  static create(initialQuantity: number = 0): ProductStock {
    if (initialQuantity < 0) {
      throw new BadRequestException('초기 재고는 0 이상이어야 합니다.');
    }

    const stock = new ProductStock();
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
      throw new BadRequestException('감소할 수량은 0보다 커야 합니다.');
    }

    if (this.quantity < quantity) {
      throw new BadRequestException(
        `재고가 부족합니다. 현재 재고: ${this.quantity}, 요청 수량: ${quantity}`,
      );
    }

    this.quantity -= quantity;
  }

  // 재고 증가
  increase(quantity: number): void {
    if (quantity <= 0) {
      throw new BadRequestException('증가할 수량은 0보다 커야 합니다.');
    }

    this.quantity += quantity;
  }
}
