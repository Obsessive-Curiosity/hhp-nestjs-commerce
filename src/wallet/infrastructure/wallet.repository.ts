import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Wallet } from '../domain/entity/wallet.entity';
import { IWalletRepository } from '../domain/interface/wallet.repository.interface';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // 사용자 ID로 지갑 조회
  async findByUserId(userId: string): Promise<Wallet | null> {
    return await this.em.findOne(Wallet, { userId });
  }

  // ==================== 생성 (Create) ====================

  // 지갑 생성
  async create(wallet: Wallet): Promise<Wallet> {
    await this.em.persistAndFlush(wallet);
    return wallet;
  }

  // ==================== 수정 (Update) ====================

  // 지갑 업데이트 (낙관적 락 적용)
  async update(wallet: Wallet): Promise<Wallet> {
    // MikroORM이 자동으로 version 증가 및 낙관적 락 적용
    await this.em.flush();
    return wallet;
  }

  // ==================== 삭제 (Delete) ====================

  // 지갑 삭제 (Hard Delete)
  async delete(userId: string): Promise<void> {
    const wallet = await this.em.findOne(Wallet, { userId });
    if (wallet) {
      await this.em.removeAndFlush(wallet);
    }
  }
}
