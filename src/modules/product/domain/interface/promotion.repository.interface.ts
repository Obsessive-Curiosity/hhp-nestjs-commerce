import { Promotion } from '../entity/promotion.entity';

export interface CreatePromotionData {
  paidQuantity: number;
  freeQuantity: number;
  startAt?: Date; // optional: 없으면 현재 시간
  endAt?: Date | null;
}

export interface IPromotionRepository {
  // 단일 조회: ID로 프로모션 조회
  findOne(id: string): Promise<Promotion | null>;

  // 다중 조회: 상품의 모든 프로모션 조회
  find(productId: string): Promise<Promotion[]>;

  // 다중 조회: 상품의 모든 활성 프로모션 조회 (현재 시점 기준)
  findActive(productId: string, now?: Date): Promise<Promotion[]>;

  // 프로모션 생성 (다중)
  createMany(promotions: Promotion[]): Promise<Promotion[]>;

  // 프로모션 업데이트
  update(promotion: Promotion): Promise<Promotion>;

  // 프로모션 삭제
  delete(id: string): Promise<void>;

  // 상품의 모든 프로모션 삭제
  deleteAll(productId: string): Promise<void>;

  // 겹치는 프로모션 존재 여부 확인 (BR-010: 같은 paidQuantity, 기간 겹침)
  existsOverlapping(
    productId: string,
    paidQuantity: number,
    startAt: Date,
    endAt: Date | null,
  ): Promise<boolean>;
}

// Repository 의존성 주입을 위한 토큰
export const PROMOTION_REPOSITORY = Symbol('PROMOTION_REPOSITORY');
