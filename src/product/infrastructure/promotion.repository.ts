import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Promotion } from '../domain/entity/promotion.entity';
import { IPromotionRepository } from '../domain/interface/promotion.repository.interface';

@Injectable()
export class PromotionRepository implements IPromotionRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // ID로 프로모션 조회
  async findOne(id: string): Promise<Promotion | null> {
    return await this.em.findOne(Promotion, { id });
  }

  // 상품의 모든 프로모션 조회
  async find(productId: string): Promise<Promotion[]> {
    return await this.em.find(
      Promotion,
      { productId },
      { orderBy: { startAt: 'DESC' } },
    );
  }

  // 상품의 모든 활성 프로모션 조회
  async findActive(
    productId: string,
    now: Date = new Date(),
  ): Promise<Promotion[]> {
    // 1. 모든 프로모션 가져오기
    const allPromotions = await this.find(productId);

    // 2. 도메인 로직(isActive)으로 필터링
    return allPromotions.filter((promotion) => promotion.isActive(now));
  }

  // 겹치는 프로모션 존재 여부 확인
  async existsOverlapping(
    productId: string,
    paidQuantity: number,
    startAt: Date,
    endAt: Date | null,
  ): Promise<boolean> {
    // 1. 같은 상품의 같은 paidQuantity를 가진 모든 프로모션 조회
    const existingPromotions = await this.em.find(Promotion, {
      productId,
      paidQuantity,
    });

    // 2. 기간 겹침 확인
    const hasOverlap = existingPromotions.some((existing) => {
      // 새 프로모션이 기존 프로모션 시작 전에 끝나는 경우 -> 안 겹침
      if (endAt && endAt < existing.startAt) {
        return false;
      }

      // 새 프로모션이 기존 프로모션 종료 후에 시작하는 경우 -> 안 겹침
      if (existing.endAt && startAt > existing.endAt) {
        return false;
      }

      // 그 외의 모든 경우는 겹침
      return true;
    });

    return hasOverlap;
  }

  // ==================== 생성 (Create) ====================

  // 프로모션 일괄 생성
  async createMany(promotions: Promotion[]): Promise<Promotion[]> {
    await this.em.persistAndFlush(promotions);
    return promotions;
  }

  // ==================== 수정 (Update) ====================

  // 프로모션 수정
  async update(promotion: Promotion): Promise<Promotion> {
    await this.em.flush();
    return promotion;
  }

  // ==================== 삭제 (Delete) ====================

  // 프로모션 삭제
  async delete(id: string): Promise<void> {
    const promotion = await this.findOne(id);
    if (promotion) {
      await this.em.removeAndFlush(promotion);
    }
  }

  // ==================== 삭제 (Batch) ====================

  // 상품의 모든 프로모션 삭제
  async deleteAll(productId: string): Promise<void> {
    const promotions = await this.find(productId);
    if (promotions.length > 0) {
      await this.em.removeAndFlush(promotions);
    }
  }
}
