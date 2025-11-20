import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/core';
import { StockService } from '@/product/domain/service/stock.service';

export interface RestoreStockItem {
  productId: string;
  quantity: number;
}

export interface RestoreStockParams {
  items: RestoreStockItem[];
}

/**
 * 재고 복구 트랜잭션
 *
 * 주문 실패 시 차감된 재고를 원자적으로 복구합니다.
 * 비관적 락(SELECT FOR UPDATE)을 사용하여 복구를 보장합니다.
 *
 * 특징:
 * - 롤백 컨텍스트에서 실행 (deduct와 동일한 트랜잭션)
 * - 복구 실패 시 치명적 (로깅 중요)
 * - Deadlock 방지를 위해 productId로 정렬
 *
 * @example
 * ```typescript
 * // 주문 실패 시 자동 롤백
 * const restoredItems = await this.restoreStockTransaction.execute({
 *   items: deductedItems,
 * });
 * ```
 */
@Injectable()
export class RestoreStockTransaction {
  constructor(private readonly stockService: StockService) {}

  /**
   * 재고 복구 실행
   *
   * @param params - 복구할 상품 목록
   * @returns 복구된 상품 목록
   * @throws NotFoundException - 상품 재고 없음 시
   * @throws BadRequestException - 입력 검증 실패 시
   */
  @Transactional()
  async execute(params: RestoreStockParams): Promise<RestoreStockItem[]> {
    const { items } = params;

    // Deadlock 방지: productId로 정렬하여 항상 동일한 순서로 락 획득
    // (deduct와 동일한 순서 보장)
    const sortedItems = [...items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    const restoredItems: RestoreStockItem[] = [];

    for (const item of sortedItems) {
      try {
        // 비관적 락을 사용한 재고 증가 (롤백용)
        // StockService.increaseStockWithLock()에서:
        // 1. 입력 검증 (quantity > 0)
        // 2. SELECT FOR UPDATE로 row lock 획득
        // 3. 재고 존재 여부 확인
        // 4. 비관적 락을 사용한 재고 증가
        await this.stockService.increaseStockWithLock(
          item.productId,
          item.quantity,
        );

        restoredItems.push(item);
      } catch (error) {
        // 롤백 실패는 치명적 - 로깅 후 에러 전파
        console.error(
          `[CRITICAL] 재고 복구 실패 - productId: ${item.productId}, quantity: ${item.quantity}`,
          error,
        );
        throw error;
      }
    }

    return restoredItems;
  }
}
