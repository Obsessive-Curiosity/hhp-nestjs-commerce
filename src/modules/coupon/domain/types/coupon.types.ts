import { CouponType } from '../entity/coupon.entity';

export type CreateCouponProps = {
  name: string;
  type: CouponType;
  discountAmount?: number | null;
  discountRate?: number | null;
  maxDiscountAmount?: number | null;
  minPurchaseAmount?: number | null;
  startAt?: Date;
  endAt?: Date | null;
  validityDays?: number | null;
  totalQuantity?: number | null;
};
