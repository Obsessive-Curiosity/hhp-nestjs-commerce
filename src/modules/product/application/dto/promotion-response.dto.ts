import { Promotion } from '@/modules/product/domain/entity/promotion.entity';

// 프로모션 정보
export class PromotionResponseDto {
  id: string;
  productId: string;
  paidQuantity: number;
  freeQuantity: number;
  format: string;
  startAt: Date;
  endAt: Date | null;
  createdAt: Date | null;

  static from(
    promotion: Promotion,
    includeCreatedAt = false,
  ): PromotionResponseDto {
    const dto = new PromotionResponseDto();
    dto.id = promotion.id;
    dto.productId = promotion.productId;
    dto.paidQuantity = promotion.paidQuantity;
    dto.freeQuantity = promotion.freeQuantity;
    dto.format = promotion.getPromotionFormat();
    dto.startAt = promotion.startAt;
    dto.endAt = promotion.endAt ?? null;
    dto.createdAt = includeCreatedAt ? promotion.createdAt : null;
    return dto;
  }
}

// 프로모션 삭제 응답
export class DeletePromotionResponseDto {
  message: string;

  static from(): DeletePromotionResponseDto {
    const dto = new DeletePromotionResponseDto();
    dto.message = '프로모션이 삭제되었습니다.';
    return dto;
  }
}
