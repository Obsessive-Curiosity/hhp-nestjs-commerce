import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Wallet } from '../entity/wallet.entity';
import {
  IWalletRepository,
  WALLET_REPOSITORY,
} from '../interface/wallet.repository.interface';

@Injectable()
export class WalletService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 사용자 지갑 조회
  async getWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findByUserId(userId);

    if (!wallet) {
      throw new NotFoundException('지갑을 찾을 수 없습니다.');
    }

    return wallet;
  }

  // 지갑 잔액 조회
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.getWallet(userId);
    return wallet.balance;
  }

  // ==================== 생성 (Create) ====================

  // 지갑 생성
  async createWallet(userId: string): Promise<Wallet> {
    const existing = await this.walletRepository.findByUserId(userId);

    if (existing) {
      throw new ConflictException('이미 존재하는 지갑입니다.');
    }

    const wallet = Wallet.create(userId);
    return await this.walletRepository.create(wallet);
  }

  // ==================== 수정 (Update) ====================

  // 지갑 충전
  async charge(userId: string, amount: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    wallet.charge(amount);
    return await this.walletRepository.update(wallet);
  }

  // 지갑 사용
  async use(userId: string, amount: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    wallet.use(amount);
    return await this.walletRepository.update(wallet);
  }

  // 지갑 환불
  async refund(userId: string, amount: number): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    wallet.refund(amount);
    return await this.walletRepository.update(wallet);
  }
}
