import { Injectable } from '@nestjs/common';
import { StockService } from '@/modules/product/domain/service/stock.service';
import { DistributedLockManager } from '@/common/lock/distributed-lock-manager.service';
import { InsufficientStockException } from '../../domain/exception';

export interface DeductStockItem {
  productId: string;
  quantity: number;
}

export interface DeductStockParams {
  items: DeductStockItem[];
}

export interface DeductStockResult {
  successfulItems: DeductStockItem[];
  failedItems: Array<{
    item: DeductStockItem;
    error: Error;
  }>;
}

@Injectable()
export class DeductStockTransaction {
  constructor(
    private readonly stockService: StockService,
    private readonly distributedLockManager: DistributedLockManager,
  ) {}

  async execute(params: DeductStockParams): Promise<DeductStockResult> {
    const { items } = params;
    const MAX_RETRIES = 3; // 최대 재시도 횟수
    const RETRY_DELAY_MS = 100; // 재시도 대기 시간 (ms)

    // Deadlock 방지: productId로 정렬하여 항상 동일한 순서로 락 획득
    const sortedItems = [...items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    const successfulItems: DeductStockItem[] = [];
    const failedItems: Array<{ item: DeductStockItem; error: Error }> = [];

    // 각 상품을 독립적으로 처리 (부분 성공 허용)
    for (const item of sortedItems) {
      const lockKey = `lock:stock:${item.productId}`;
      let lastError: Error | null = null;
      let succeeded = false;

      // 재시도 루프
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          // 분산락을 사용하여 재고 차감 보장
          await this.distributedLockManager.executeWithLock(
            lockKey,
            async () => {
              await this.stockService.decreaseStock(
                item.productId,
                item.quantity,
              ); // 재고 차감 트랜잭션
            },
          );

          // 성공 기록
          successfulItems.push(item);
          succeeded = true;
          break; // 성공하면 재시도 루프 종료
        } catch (error) {
          lastError = error as Error;

          // 재고 부족은 재시도해도 소용없음 → 즉시 실패 처리
          if (error instanceof InsufficientStockException) {
            break;
          }

          // 락 타임아웃이면 재시도
          if (attempt < MAX_RETRIES) {
            // 짧은 대기 후 재시도
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          }
        }
      }

      // 재시도 후에도 실패한 경우
      if (!succeeded && lastError) {
        if (lastError instanceof InsufficientStockException) {
          // 재고 부족은 failedItems에 추가
          failedItems.push({ item, error: lastError });
        } else {
          // 락 타임아웃 등은 전체 실패로 처리
          throw lastError;
        }
      }
    }

    // 성공/실패 모두 반환 (호출자가 부분 성공 처리)
    return { successfulItems, failedItems };
  }
}
