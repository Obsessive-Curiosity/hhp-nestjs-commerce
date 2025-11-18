import { ConflictException, Injectable } from '@nestjs/common';
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
    // 낙관적 락 적용 - 원자적 업데이트
    const { userId, version, balance } = wallet;
    const oldVersion = version - 1;

    const updated = await this.em.nativeUpdate(
      Wallet,
      { userId, version: oldVersion },
      {
        balance,
        version,
      },
    );

    if (!updated) {
      throw new ConflictException(
        '지갑 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
      );
    }

    // 최신 데이터 조회
    const result = await this.findByUserId(userId);
    return result!;
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
