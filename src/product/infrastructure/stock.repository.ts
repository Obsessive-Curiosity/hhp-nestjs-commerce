import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { ProductStock } from '../domain/entity/product-stock.entity';
import { Product } from '../domain/entity/product.entity';
import { IStockRepository } from '../domain/interface/stock.repository.interface';

@Injectable()
export class StockRepository implements IStockRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // 상품별 재고 조회
  async findByProductId(productId: string): Promise<ProductStock | null> {
    return await this.em.findOne(ProductStock, { product: productId });
  }

  // 재고 수량 조회
  async getQuantity(productId: string): Promise<number> {
    const stock = await this.em.findOne(ProductStock, { product: productId });
    return stock?.quantity ?? 0;
  }

  // 재고 존재 여부 확인
  async exists(productId: string): Promise<boolean> {
    const count = await this.em.count(ProductStock, { product: productId });
    return count > 0;
  }

  // ==================== 생성 (Create) ====================

  // 재고 저장
  async create(stock: ProductStock): Promise<ProductStock> {
    await this.em.persistAndFlush(stock);
    return stock;
  }

  // 재고 생성
  async createStock(
    productId: string,
    initialQuantity: number,
  ): Promise<ProductStock> {
    const stock = new ProductStock();

    // em.getReference() 사용: DB 조회 없이 Product 참조만 생성
    stock.product = this.em.getReference(Product, productId);
    stock.quantity = initialQuantity;

    await this.em.persistAndFlush(stock);
    return stock;
  }

  // ==================== 수정 (Update) ====================

  // 낙관적 락을 사용한 재고 증가
  async increaseWithVersion(
    productId: string,
    quantity: number,
    currentVersion: number,
  ): Promise<void> {
    const stock = await this.em.findOne(ProductStock, {
      product: productId,
      version: currentVersion,
    });

    if (!stock) {
      throw new Error(
        '재고 증가 실패: 다른 트랜잭션에 의해 변경되었습니다. 다시 시도해주세요.',
      );
    }

    stock.quantity += quantity;

    await this.em.flush();
  }

  // 낙관적 락을 사용한 재고 감소
  async decreaseWithVersion(
    productId: string,
    quantity: number,
    currentVersion: number,
  ): Promise<void> {
    const stock = await this.em.findOne(ProductStock, {
      product: productId,
      version: currentVersion,
    });

    if (!stock) {
      throw new Error(
        '재고 감소 실패: 재고가 부족하거나 다른 트랜잭션에 의해 변경되었습니다.',
      );
    }

    if (stock.quantity < quantity) {
      throw new Error(
        '재고 감소 실패: 재고가 부족하거나 다른 트랜잭션에 의해 변경되었습니다.',
      );
    }

    stock.quantity -= quantity;

    await this.em.flush();
  }
}
