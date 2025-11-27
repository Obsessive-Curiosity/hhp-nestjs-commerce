import { Injectable } from '@nestjs/common';
import { Stock } from '../domain/entity/stock.entity';
import { IStockRepository } from '../domain/interface/stock.repository.interface';
import {
  InsufficientStockException,
  StockNotFoundException,
} from '../domain/exception';
import { EntityManager, raw } from '@mikro-orm/mysql';

@Injectable()
export class StockRepository implements IStockRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 ====================

  /**
   * 상품별 재고 조회
   */
  async findByProductId(productId: string): Promise<Stock | null> {
    return await this.em.findOne(Stock, { productId });
  }

  /**
   * 재고 수량 조회
   */
  async getQuantity(productId: string): Promise<number> {
    const stock = await this.em.findOne(Stock, { productId });
    return stock?.quantity ?? 0;
  }

  /**
   * 재고 존재 여부 확인
   */
  async exists(productId: string): Promise<boolean> {
    const count = await this.em.count(Stock, { productId });
    return count > 0;
  }

  // ================= 생성/수정 ==================

  /**
   * 재고 엔티티 저장
   */
  async save(stock: Stock): Promise<Stock> {
    await this.em.persistAndFlush(stock);
    return stock;
  }

  // ============== 트랜잭션 작업 ===============

  /**
   * 재고 증가 (롤백/반품용)
   * 최적화: 단일 UPDATE 쿼리로 처리
   */
  async increase(productId: string, quantity: number): Promise<void> {
    await this.em.transactional(async (em) => {
      const affectedRows = await em.nativeUpdate(
        Stock,
        { productId },
        {
          quantity: raw('quantity + ?', [quantity]),
        },
      );

      // 영향받은 행이 0 = 상품 없음
      if (affectedRows === 0) {
        throw new StockNotFoundException(productId);
      }
    });
  }

  /**
   * 재고 감소
   * 최적화: 단일 UPDATE 쿼리로 처리
   * 조건부 UPDATE로 재고 부족 체크 포함
   */
  async decrease(productId: string, quantity: number): Promise<void> {
    await this.em.transactional(async (em) => {
      // nativeUpdate로 조건부 UPDATE
      const affectedRows = await em.nativeUpdate(
        Stock,
        { productId, quantity: { $gte: quantity } }, // 재고 충분한 경우에만
        { quantity: raw('quantity - ?', [quantity]) },
      );

      // 영향받은 행이 0 = 재고 부족 or 상품 없음
      if (affectedRows === 0) {
        // 실패 원인 파악을 위해 조회 (실패 시에만)
        const stock = await em.findOne(Stock, { productId });

        if (!stock) {
          throw new StockNotFoundException(productId);
        }

        // 재고 부족
        throw new InsufficientStockException(stock.quantity, quantity);
      }
    });
  }
}
