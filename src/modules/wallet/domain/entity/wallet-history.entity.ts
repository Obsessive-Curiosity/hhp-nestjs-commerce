import { Entity, PrimaryKey, Property, Enum, t, Index } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

export enum WalletHistoryType {
  CHARGE = 'CHARGE', // 충전
  USE = 'USE', // 사용
  REFUND = 'REFUND', // 환불 (사용 포인트 복원)
}

export type CreateWalletHistoryProps = {
  userId: string;
  type: WalletHistoryType;
  amount: number;
  balance: number;
  orderId?: string;
};

@Entity({ tableName: 'wallet_history' })
@Index({ name: 'fk_wallet_history_userId', properties: ['userId'] })
@Index({ name: 'fk_wallet_history_orderId', properties: ['orderId'] })
export class WalletHistory {
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  // User 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  userId!: string;

  // Order 엔티티를 참조 (N:1 관계, nullable)
  @Property({ type: t.character, length: 36, nullable: true })
  orderId?: string | null;

  @Enum(() => WalletHistoryType)
  type!: WalletHistoryType;

  @Property({ type: t.integer })
  amount!: number;

  @Property({ type: t.integer })
  balance!: number;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  // =================== Constructor ===================

  protected constructor(data?: Partial<WalletHistory>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  static create(params: CreateWalletHistoryProps): WalletHistory {
    const forbidsOrderId = params.type === WalletHistoryType.CHARGE; // CHARGE 타입은 orderId가 있으면 안 됨
    const requiredOrderId =
      params.type === WalletHistoryType.USE ||
      params.type === WalletHistoryType.REFUND; // USE, REFUND 타입은 orderId가 필수

    if (forbidsOrderId && params.orderId) {
      throw new BadRequestException(
        'CHARGE 타입의 이력은 orderId가 있으면 안 됩니다.',
      );
    }

    if (requiredOrderId && !params.orderId) {
      throw new BadRequestException(
        `${params.type} 타입의 이력은 orderId가 필수입니다.`,
      );
    }

    const history = new WalletHistory();
    history.userId = params.userId;
    history.orderId = params.orderId ?? null;
    history.type = params.type;
    history.amount = params.amount;
    history.balance = params.balance;

    return history;
  }
}
