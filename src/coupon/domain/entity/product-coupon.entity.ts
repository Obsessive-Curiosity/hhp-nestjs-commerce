export interface ProductCouponProps {
  couponId: string;
  productId: string;
}

export class ProductCoupon {
  private readonly _couponId: string;
  private readonly _productId: string;

  constructor(props: ProductCouponProps) {
    this._couponId = props.couponId;
    this._productId = props.productId;
  }

  // Getters
  get couponId(): string {
    return this._couponId;
  }

  get productId(): string {
    return this._productId;
  }

  // Factory 메서드: 새로운 관계 생성
  static create(params: {
    couponId: string;
    productId: string;
  }): ProductCoupon {
    return new ProductCoupon({
      couponId: params.couponId,
      productId: params.productId,
    });
  }
}
