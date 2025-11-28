export class CartItem {
  private constructor(
    private readonly _productId: string,
    private _quantity: number,
  ) {
    this.validateQuantity(_quantity);
  }

  static create(productId: string, quantity: number): CartItem {
    return new CartItem(productId, quantity);
  }

  get productId(): string {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  updateQuantity(quantity: number): void {
    this.validateQuantity(quantity);
    this._quantity = quantity;
  }

  private validateQuantity(quantity: number): void {
    if (quantity < 1) {
      throw new Error('수량은 1개 이상이어야 합니다.');
    }
    if (!Number.isInteger(quantity)) {
      throw new Error('수량은 정수여야 합니다.');
    }
  }

  toJSON() {
    return {
      productId: this._productId,
      quantity: this._quantity,
    };
  }
}
