import { Inject, Injectable } from '@nestjs/common';
import {
  WalletHistory,
  WalletHistoryType,
} from '../entity/wallet-history.entity';
import {
  IWalletHistoryRepository,
  WALLET_HISTORY_REPOSITORY,
} from '../interface/wallet-history.repository.interface';

@Injectable()
export class WalletHistoryService {
  constructor(
    @Inject(WALLET_HISTORY_REPOSITORY)
    private readonly walletHistoryRepository: IWalletHistoryRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 사용자별 이력 조회
  async getHistoriesByUserId(userId: string): Promise<WalletHistory[]> {
    return await this.walletHistoryRepository.findByUserId(userId);
  }

  // 주문별 이력 조회
  async getHistoriesByOrderId(orderId: string): Promise<WalletHistory[]> {
    return await this.walletHistoryRepository.findByOrderId(orderId);
  }

  // ==================== 생성 (Create) ====================

  // 충전 이력 기록
  async recordCharge(
    userId: string,
    amount: number,
    balance: number,
  ): Promise<WalletHistory> {
    const history = WalletHistory.create({
      userId,
      type: WalletHistoryType.CHARGE,
      amount,
      balance,
    });
    return await this.walletHistoryRepository.save(history);
  }

  // 사용 이력 기록
  async recordUse(
    userId: string,
    amount: number,
    balance: number,
    orderId: string,
  ): Promise<WalletHistory> {
    const history = WalletHistory.create({
      userId,
      type: WalletHistoryType.USE,
      amount: -amount, // 사용은 음수로 기록
      balance,
      orderId,
    });
    return await this.walletHistoryRepository.save(history);
  }

  // 환불 이력 기록
  async recordRefund(
    userId: string,
    amount: number,
    balance: number,
    orderId: string,
  ): Promise<WalletHistory> {
    const history = WalletHistory.create({
      userId,
      type: WalletHistoryType.REFUND,
      amount,
      balance,
      orderId,
    });
    return await this.walletHistoryRepository.save(history);
  }
}
