import { Injectable } from '@nestjs/common';
import { WalletService } from '../domain/service/wallet.service';
import { WalletHistoryService } from '../domain/service/wallet-history.service';
import { ChargeWalletDto } from '../presentation/dto/charge-wallet.dto';
import { WalletBalanceResponseDto } from '../presentation/dto/wallet-balance-response.dto';
import { WalletHistoryResponseDto } from '../presentation/dto/wallet-history-response.dto';
import { Wallet } from '../domain/entity/wallet.entity';

@Injectable()
export class WalletFacade {
  constructor(
    private readonly walletService: WalletService,
    private readonly walletHistoryService: WalletHistoryService,
  ) {}

  // 지갑 충전
  async chargeWallet(
    userId: string,
    dto: ChargeWalletDto,
  ): Promise<WalletBalanceResponseDto> {
    const wallet = await this.walletService.charge(userId, dto.amount);
    await this.walletHistoryService.recordCharge(
      userId,
      dto.amount,
      wallet.balance,
    );

    return {
      balance: wallet.balance,
      updatedAt: wallet.updatedAt,
    };
  }

  // 지갑 사용 (OrderService에서 호출)
  async useWallet(
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<Wallet> {
    const wallet = await this.walletService.use(userId, amount);
    await this.walletHistoryService.recordUse(
      userId,
      amount,
      wallet.balance,
      orderId,
    );
    return wallet;
  }

  // 지갑 환불 (OrderService에서 호출)
  async refundWallet(
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<Wallet> {
    const wallet = await this.walletService.refund(userId, amount);
    await this.walletHistoryService.recordRefund(
      userId,
      amount,
      wallet.balance,
      orderId,
    );
    return wallet;
  }

  // 지갑 잔액 조회
  async getBalance(userId: string): Promise<WalletBalanceResponseDto> {
    const wallet = await this.walletService.getWallet(userId);

    return {
      balance: wallet.balance,
      updatedAt: wallet.updatedAt,
    };
  }

  // 지갑 사용 내역 조회
  async getHistories(userId: string): Promise<WalletHistoryResponseDto[]> {
    const histories =
      await this.walletHistoryService.getHistoriesByUserId(userId);

    return histories.map((h) => ({
      id: h.id,
      orderId: h.orderId ?? null,
      type: h.type,
      amount: h.amount,
      balance: h.balance,
      createdAt: h.createdAt,
    }));
  }
}
