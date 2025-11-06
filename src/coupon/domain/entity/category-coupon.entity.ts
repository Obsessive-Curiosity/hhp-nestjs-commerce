export interface CategoryCouponProps {
  couponId: string;
  categoryId: number;
}

export class CategoryCoupon {
  private readonly _couponId: string;
  private readonly _categoryId: number;

  constructor(props: CategoryCouponProps) {
    this._couponId = props.couponId;
    this._categoryId = props.categoryId;
  }

  // Getters
  get couponId(): string {
    return this._couponId;
  }

  get categoryId(): number {
    return this._categoryId;
  }

  // Factory 메서드: 새로운 관계 생성
  static create(params: {
    couponId: string;
    categoryId: number;
  }): CategoryCoupon {
    return new CategoryCoupon({
      couponId: params.couponId,
      categoryId: params.categoryId,
    });
  }
}
