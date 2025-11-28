import { Injectable } from '@nestjs/common';
import { StockService } from '@/modules/product/domain/service/stock.service';
import { DistributedLockManager } from '@/common/lock/distributed-lock-manager.service';

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
 * Redis 분산락을 사용하여 복구를 보장합니다.
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
  constructor(
    private readonly stockService: StockService,
    private readonly distributedLockManager: DistributedLockManager,
  ) {}

  /**
   * 재고 복구 실행
   *
   * @param params - 복구할 상품 목록
   * @returns 복구된 상품 목록
   * @throws NotFoundException - 상품 재고 없음 시
   * @throws BadRequestException - 입력 검증 실패 시
   */
  async execute(params: RestoreStockParams): Promise<RestoreStockItem[]> {
    const { items } = params; // 복구할 상품 id 목록

    // Deadlock 방지: productId로 정렬하여 항상 동일한 순서로 락 획득
    const sortedItems = [...items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    const restoredItems: RestoreStockItem[] = [];

    for (const item of sortedItems) {
      const lockKey = `lock:stock:${item.productId}`;

      // 분산락을 사용하여 재고 복구 보장
      await this.distributedLockManager.executeWithLock(lockKey, async () => {
        await this.stockService.increaseStock(item.productId, item.quantity); // 재고 복구 트랜잭션
      });

      restoredItems.push(item);
    }

    return restoredItems;
  }
}
