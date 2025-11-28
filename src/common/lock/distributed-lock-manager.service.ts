import { Injectable } from '@nestjs/common';
import { DistributedLockService } from './distributed-lock.service';

/**
 * 분산락 매니저
 *
 * Redis 분산락을 재사용 가능한 방식으로 관리합니다.
 * Lock 획득 → 실행 → Lock 해제 패턴을 캡슐화합니다.
 *
 * 트랜잭션은 비즈니스 로직에서 @Transactional() 데코레이터로 관리합니다.
 *
 * @example
 * ```typescript
 * await this.distributedLockManager.executeWithLock(
 *   `lock:stock:${productId}`,
 *   async () => {
 *     // @Transactional()이 붙은 메서드 호출
 *     await this.stockService.decreaseStock(productId, quantity);
 *   }
 * );
 * ```
 */
@Injectable()
export class DistributedLockManager {
  constructor(private readonly lockService: DistributedLockService) {}

  /**
   * 분산락 하에서 함수 실행
   *
   * 동작 순서:
   * 1. Redis 분산락 획득
   * 2. 비즈니스 로직 실행
   *    - @Transactional()이 있으면 자동으로 트랜잭션 관리
   * 3. 반드시 분산락 해제 (finally)
   *
   * @param lockKey - Redis 락 키 (예: 'lock:stock:product-123')
   * @param fn - 실행할 비즈니스 로직
   * @returns 비즈니스 로직의 반환값
   * @throws 락 획득 실패, 비즈니스 로직 실패 등
   */
  async executeWithLock<T>(lockKey: string, fn: () => Promise<T>): Promise<T> {
    // 1. Redis 분산락 획득
    const lock = await this.lockService.acquire(lockKey);

    try {
      // 2. 비즈니스 로직 실행
      // @Transactional() 데코레이터가 트랜잭션을 관리
      return await fn();
    } finally {
      // 3. 반드시 분산락 해제
      await this.lockService.release(lock);
    }
  }
}
