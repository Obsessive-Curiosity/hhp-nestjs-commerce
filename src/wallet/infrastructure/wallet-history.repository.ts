import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { WalletHistory } from '../domain/entity/wallet-history.entity';
import { IWalletHistoryRepository } from '../domain/interface/wallet-history.repository.interface';

@Injectable()
export class WalletHistoryRepository implements IWalletHistoryRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // 사용자별 지갑 이력 조회
  async findByUserId(userId: string): Promise<WalletHistory[]> {
    return await this.em.find(
      WalletHistory,
      { userId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  // 주문별 지갑 이력 조회
  async findByOrderId(orderId: string): Promise<WalletHistory[]> {
    return await this.em.find(
      WalletHistory,
      { orderId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  // ==================== 생성 (Create) ====================

  // 지갑 이력 저장
  async save(history: WalletHistory): Promise<WalletHistory> {
    await this.em.persistAndFlush(history);
    return history;
  }

  // ==================== 삭제 (Delete) ====================

  // 사용자별 지갑 이력 삭제
  async deleteByUserId(userId: string): Promise<void> {
    await this.em.nativeDelete(WalletHistory, { userId });
  }
}
