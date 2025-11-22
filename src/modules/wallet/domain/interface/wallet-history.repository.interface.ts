import { WalletHistory } from '../entity/wallet-history.entity';

export const WALLET_HISTORY_REPOSITORY = Symbol('WALLET_HISTORY_REPOSITORY');

export interface IWalletHistoryRepository {
  // WalletHistory 조회
  findByUserId(userId: string): Promise<WalletHistory[]>;
  findByOrderId(orderId: string): Promise<WalletHistory[]>;

  // WalletHistory 생성
  save(history: WalletHistory): Promise<WalletHistory>;

  // WalletHistory 삭제 (Hard Delete)
  deleteByUserId(userId: string): Promise<void>;
}
