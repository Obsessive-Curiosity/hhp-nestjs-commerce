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
import { CreatePromotionsDto } from '@/product/presentation/dto';

@Injectable()
export class PromotionService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly promotionRepository: IPromotionRepository,
  ) {}

  async create(
    productId: string,
    dto: CreatePromotionsDto,
  ): Promise<Promotion[]> {
    // BR-010: 한 상품에 같은 paidQuantity의 프로모션은 하나만 존재해야 함
    for (const promotionData of dto) {
      const exists =
        await this.promotionRepository.existsByProductIdAndPaidQuantity(
          productId,
          promotionData.paidQuantity,
        );

      if (exists) {
        throw new ConflictException(
          `이미 동일한 수량(${promotionData.paidQuantity})의 프로모션이 존재합니다.`,
        );
      }
    }

    // DTO를 Repository Data로 변환 (startAt 기본값 설정)
    const promotionsData = dto.map((item) => ({
      paidQuantity: item.paidQuantity,
      freeQuantity: item.freeQuantity,
      startAt: item.startAt ?? new Date(),
      endAt: item.endAt ?? null,
    }));

    // 프로모션 생성
    return this.promotionRepository.createMany(productId, promotionsData);
  }

  async delete(id: string): Promise<void> {
    const promotion = await this.promotionRepository.findById(id);

    if (!promotion) {
      throw new NotFoundException(`ID ${id}인 프로모션을 찾을 수 없습니다.`);
    }

    await this.promotionRepository.delete(id);
  }

  // 상품의 활성 프로모션 조회
  async getActivePromotion(productId: string): Promise<Promotion | null> {
    return this.promotionRepository.findActiveByProductId(productId);
  }

  // 상품의 모든 프로모션 조회
  async getPromotionsByProductId(productId: string): Promise<Promotion[]> {
    return this.promotionRepository.findByProductId(productId);
  }
}
