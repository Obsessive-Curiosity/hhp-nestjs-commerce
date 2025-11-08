import { Promotion } from '../entity/promotion.entity';

export interface CreatePromotionData {
  paidQuantity: number;
  freeQuantity: number;
  startAt?: Date; // optional: 없으면 현재 시간
  endAt?: Date | null;
}

export interface IPromotionRepository {
  // ID로 프로모션 조회
  findById(id: string): Promise<Promotion | null>;

  // 상품의 모든 프로모션 조회
  findByProductId(productId: string): Promise<Promotion[]>;

  // 상품의 활성 프로모션 조회 (현재 시점 기준)
  findActiveByProductId(
    productId: string,
    now?: Date,
  ): Promise<Promotion | null>;

  // 특정 수량의 프로모션이 이미 존재하는지 확인 (BR-010: 한 상품에 같은 paidQuantity의 프로모션은 하나만)
  existsByProductIdAndPaidQuantity(
    productId: string,
    paidQuantity: number,
  ): Promise<boolean>;

  // 프로모션 생성 (단일)
  create(
    productId: string,
    promotionData: CreatePromotionData,
  ): Promise<Promotion>;

  // 프로모션 생성 (다중)
  createMany(
    productId: string,
    promotionsData: CreatePromotionData[],
  ): Promise<Promotion[]>;

  // 프로모션 업데이트
  update(promotion: Promotion): Promise<Promotion>;

  // 프로모션 삭제
  delete(id: string): Promise<void>;

  // 상품의 모든 프로모션 삭제
  deleteByProductId(productId: string): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const PROMOTION_REPOSITORY = Symbol('PROMOTION_REPOSITORY');
