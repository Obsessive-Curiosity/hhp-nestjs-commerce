import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
} from '../interface/promotion.repository.interface';
import { Promotion } from '../entity/promotion.entity';
import { CreatePromotionsProps } from '../types';
import { Transactional } from '@mikro-orm/core';

@Injectable()
export class PromotionService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 상품의 모든 활성 프로모션 조회
  async getActivePromotions(productId: string): Promise<Promotion[]> {
    return this.promotionRepository.findActive(productId);
  }

  // 상품의 모든 프로모션 조회
  async getPromotionsByProductId(productId: string): Promise<Promotion[]> {
    return this.promotionRepository.find(productId);
  }

  // ==================== 생성 (Create) ====================

  // 프로모션 일괄 생성
  @Transactional()
  async createPromotions(
    productId: string,
    props: CreatePromotionsProps,
  ): Promise<Promotion[]> {
    // BR-010: 활성 기간이 겹치는 같은 paidQuantity의 프로모션은 존재할 수 없음

    // 1. Props 내부 겹침 검증 (같은 요청 내에서 겹치는 프로모션 방지)
    this.validatePropsOverlaps(props);

    // 2. DB 기존 프로모션과 겹침 검증
    await this.validateDbOverlaps(productId, props);

    // 3. Service에서 엔티티 생성 (도메인 로직 실행)
    const promotions = props.map((item) =>
      Promotion.create({
        productId,
        paidQuantity: item.paidQuantity,
        freeQuantity: item.freeQuantity,
        startAt: item.startAt ?? new Date(),
        endAt: item.endAt ?? null,
      }),
    );

    // 4. Repository는 단순히 저장만 수행
    return this.promotionRepository.createMany(promotions);
  }

  // ==================== 삭제 (Delete) ====================

  // 프로모션 삭제
  async delete(id: string): Promise<void> {
    const promotion = await this.promotionRepository.findOne(id);

    if (!promotion) {
      throw new NotFoundException(`ID ${id}인 프로모션을 찾을 수 없습니다.`);
    }

    await this.promotionRepository.delete(id);
  }

  // ==================== 검증 (private) ====================

  // Props 내부 중복 검증 (같은 paidQuantity가 있으면 즉시 에러)
  private validatePropsOverlaps(props: CreatePromotionsProps): void {
    const paidQuantitySet = new Set<number>();

    for (const promotionData of props) {
      const { paidQuantity } = promotionData;

      if (paidQuantitySet.has(paidQuantity)) {
        throw new ConflictException({
          message: '요청 내에 같은 paidQuantity의 프로모션이 중복됩니다.',
          error: 'Props Promotion Overlap',
          duplicatedPaidQuantity: paidQuantity,
        });
      }

      paidQuantitySet.add(paidQuantity);
    }
  }

  // DB 기존 프로모션과 겹침 검증 (모든 겹침을 한번에 수집)
  private async validateDbOverlaps(
    productId: string,
    props: CreatePromotionsProps,
  ): Promise<void> {
    const overlappingPaidQuantities: number[] = [];

    // 모든 프로모션 Props에 대해 DB 겹침 확인
    for (const promotionData of props) {
      const startAt = promotionData.startAt ?? new Date();
      const endAt = promotionData.endAt ?? null;

      const exists = await this.promotionRepository.existsOverlapping(
        productId,
        promotionData.paidQuantity,
        startAt,
        endAt,
      );

      if (exists) {
        overlappingPaidQuantities.push(promotionData.paidQuantity);
      }
    }

    // 겹치는 프로모션이 있으면 모두 모아서 에러
    if (overlappingPaidQuantities.length > 0) {
      throw new ConflictException({
        message: '일부 프로모션이 기존 프로모션과 기간이 겹칩니다.',
        error: 'Database Promotion Overlap',
        overlappingPaidQuantity: overlappingPaidQuantities,
      });
    }
  }
}
