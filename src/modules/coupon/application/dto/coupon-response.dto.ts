import { Coupon, CouponType } from '../../domain/entity/coupon.entity';

export class CouponResponseDto {
  id: string;
  name: string;
  type: CouponType;
  discountAmount: number | null;
  discountRate: number | null;
  maxDiscountAmount: number | null;
  minPurchaseAmount: number | null;
  startAt: Date;
  endAt: Date | null;
  validityDays: number | null;
  totalQuantity: number | null;
  issuedQuantity: number;
  isUnlimited: boolean;
  remainingQuantity: number | null;
  canIssue: boolean;

  // 엔티티 → DTO 변환
  static from(coupon: Coupon): CouponResponseDto {
    const dto = new CouponResponseDto();
    dto.id = coupon.id;
    dto.name = coupon.name;
    dto.type = coupon.type;
    dto.discountAmount = coupon.discountAmount;
    dto.discountRate = coupon.discountRate;
    dto.maxDiscountAmount = coupon.maxDiscountAmount;
    dto.minPurchaseAmount = coupon.minPurchaseAmount;
    dto.startAt = coupon.startAt;
    dto.endAt = coupon.endAt;
    dto.validityDays = coupon.validityDays;
    dto.totalQuantity = coupon.totalQuantity;
    dto.issuedQuantity = coupon.issuedQuantity;
    dto.isUnlimited = coupon.isUnlimited();
    dto.remainingQuantity = coupon.getRemainingQuantity();
    dto.canIssue = coupon.canIssue();
    return dto;
  }
}
