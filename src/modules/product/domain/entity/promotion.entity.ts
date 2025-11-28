import { Entity, PrimaryKey, Property, t, Index } from '@mikro-orm/core';
import { v7 as uuidv7 } from 'uuid';
import { BadRequestException } from '@nestjs/common';
import dayjs from 'dayjs';

export type CreatePromotionProps = {
  productId: string;
  paidQuantity: number;
  freeQuantity: number;
  startAt: Date;
  endAt?: Date | null;
};

@Entity()
@Index({ name: 'fk_promotion_productId', properties: ['productId'] })
export class Promotion {
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  // Product 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  productId!: string;

  // 유료 수량 (N+M에서 N)
  @Property({ type: t.integer })
  paidQuantity!: number;

  // 무료 수량 (N+M에서 M)
  @Property({ type: t.integer })
  freeQuantity!: number;

  // 프로모션 시작일
  @Property()
  startAt!: Date;

  // 프로모션 종료일 (null = 무기한)
  @Property({ nullable: true })
  endAt: Date | null = null;

  // 프로모션 생성일
  @Property({ onCreate: () => new Date() })
  createdAt: Date;

  // 프로모션 수정일
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  updatedAt: Date;

  // =================== Constructor ===================

  protected constructor(data?: Partial<Promotion>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  // Factory 메서드: 신규 프로모션 생성
  static create(params: CreatePromotionProps): Promotion {
    const promotion = new Promotion();
    const { productId, paidQuantity, freeQuantity, startAt, endAt } = params;

    // 검증
    promotion.validateQuantities(paidQuantity, freeQuantity);
    promotion.validatePeriod(startAt, endAt);

    // 검증 통과 후 값 할당
    promotion.productId = productId;
    promotion.paidQuantity = paidQuantity;
    promotion.freeQuantity = freeQuantity;
    promotion.startAt = startAt;
    promotion.endAt = endAt ?? null;

    return promotion;
  }

  // ======================= 조회 =======================

  // 프로모션 형식 문자열 반환 (예: "10+1")
  getPromotionFormat(): string {
    return `${this.paidQuantity}+${this.freeQuantity}`;
  }

  // 프로모션 활성 여부 확인
  isActive(now: Date = new Date()): boolean {
    const isStarted = this.startAt <= now;
    const endNextDay = this.getEndNextDay();
    const isEnded = endNextDay ? endNextDay <= now : false;

    return isStarted && !isEnded;
  }

  // 프로모션 만료 확인
  isExpired(now: Date = new Date()): boolean {
    const endNextDay = this.getEndNextDay();
    if (!endNextDay) return false;
    return endNextDay <= now;
  }

  // 프로모션 시작 전 확인
  isNotStarted(now: Date = new Date()): boolean {
    return now < this.startAt;
  }

  // 프로모션 적용 가능한 세트 수
  getApplicableSets(quantity: number): number {
    if (quantity < this.paidQuantity) return 0;
    return Math.floor(quantity / this.paidQuantity);
  }

  // 프로모션으로 받을 수 있는 무료 수량
  getFreeQuantity(quantity: number): number {
    const sets = this.getApplicableSets(quantity);
    return sets * this.freeQuantity;
  }

  // 실제 지불해야 할 수량
  getPayableQuantity(quantity: number): number {
    const freeQty = this.getFreeQuantity(quantity);
    return quantity - freeQty;
  }

  // ======================= 수정 =======================

  // 프로모션 정보 업데이트
  update(params: {
    paidQuantity?: number;
    freeQuantity?: number;
    startAt?: Date;
    endAt?: Date | null;
  }): void {
    const { paidQuantity, freeQuantity, startAt, endAt } = params;

    // 업데이트될 값 준비
    const newPaidQuantity = paidQuantity ?? this.paidQuantity;
    const newFreeQuantity = freeQuantity ?? this.freeQuantity;
    const newStartAt = startAt ?? this.startAt;
    const newEndAt = endAt !== undefined ? endAt : this.endAt;

    // 검증
    this.validateQuantities(newPaidQuantity, newFreeQuantity);
    this.validatePeriod(newStartAt, newEndAt);

    // 검증 통과 후 값 업데이트
    this.paidQuantity = newPaidQuantity;
    this.freeQuantity = newFreeQuantity;
    this.startAt = newStartAt;
    this.endAt = newEndAt;
  }

  // ======================= 검증 =======================

  // 기간 검증
  validatePeriod(startAt: Date, endAt?: Date | null): void {
    if (endAt && endAt < startAt) {
      throw new BadRequestException(
        '프로모션 종료일은 시작일보다 나중이어야 합니다.',
      );
    }
  }

  // 수량 검증
  validateQuantities(paidQuantity: number, freeQuantity: number): void {
    if (paidQuantity <= 0) {
      throw new BadRequestException('유료 수량은 0보다 커야 합니다.');
    }
    if (freeQuantity <= 0) {
      throw new BadRequestException('무료 수량은 0보다 커야 합니다.');
    }
  }

  // ================ Helper (private) =================

  // endAt에 1일을 더한 날짜 반환 (프로모션 실질적 종료 시점)
  private getEndNextDay(): Date | null {
    if (!this.endAt) return null;
    return dayjs(this.endAt).add(1, 'day').toDate();
  }
}
