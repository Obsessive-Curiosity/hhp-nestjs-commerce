import { Wallet } from '../entity/wallet.entity';

export const WALLET_REPOSITORY = Symbol('WALLET_REPOSITORY');

export interface IWalletRepository {
  // Wallet 조회
  findByUserId(userId: string): Promise<Wallet | null>;

  // Wallet 생성
  create(wallet: Wallet): Promise<Wallet>;

  // Wallet 수정
  update(wallet: Wallet): Promise<Wallet>;

  // Wallet 삭제 (Hard Delete)
  delete(userId: string): Promise<void>;
}
