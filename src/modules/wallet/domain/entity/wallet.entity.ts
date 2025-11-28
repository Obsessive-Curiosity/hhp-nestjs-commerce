import { Entity, Property, PrimaryKey, t } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';

@Entity()
export class Wallet {
  // User 엔티티를 참조 (1:1 관계)
  @PrimaryKey({ type: t.character, length: 36 })
  userId!: string;

  @Property()
  balance!: number;

  @Property({ onCreate: () => new Date() })
  createdAt!: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt!: Date;

  @Property({ version: true })
  version!: number;

  // =================== Constructor ===================

  protected constructor(data?: Partial<Wallet>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  // 지갑 생성
  static create(userId: string): Wallet {
    const wallet = new Wallet();

    wallet.userId = userId;
    wallet.balance = 0;

    return wallet;
  }

  // ======================= 조회 =======================

  // 잔액이 충분한지 확인
  hasEnoughBalance(amount: number): boolean {
    return this.balance >= amount;
  }

  // ======================= 수정 =======================

  // 지갑 충전
  charge(amount: number): void {
    if (amount <= 0) {
      throw new BadRequestException('충전 금액은 0보다 커야 합니다.');
    }

    this.balance += amount;
  }

  // 지갑 사용
  use(amount: number): void {
    if (amount <= 0) {
      throw new BadRequestException('사용 금액은 0보다 커야 합니다.');
    }

    if (!this.hasEnoughBalance(amount)) {
      throw new BadRequestException(
        `잔액이 부족합니다. (잔액: ${this.balance}, 사용 요청: ${amount})`,
      );
    }

    this.balance -= amount;
  }

  // 환불 (주문 취소 시)
  refund(amount: number): void {
    if (amount <= 0) {
      throw new BadRequestException('환불 금액은 0보다 커야 합니다.');
    }

    this.balance += amount;
  }
}
