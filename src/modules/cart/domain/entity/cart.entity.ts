import { CartItem } from './cart-item.entity';

export class Cart {
  private readonly items: Map<string, CartItem>;

  private constructor(
    private readonly _userId: string,
    items: Map<string, CartItem> = new Map(),
  ) {
    this.items = items;
  }

  static create(userId: string): Cart {
    return new Cart(userId);
  }

  static fromRedisData(
    userId: string,
    redisData: Record<string, string>,
  ): Cart {
    const items = new Map<string, CartItem>();

    for (const [productId, quantityStr] of Object.entries(redisData)) {
      const quantity = +quantityStr;
      items.set(productId, CartItem.create(productId, quantity));
    }

    return new Cart(userId, items);
  }

  get userId(): string {
    return this._userId;
  }

  getItems(): CartItem[] {
    return [...this.items.values()];
  }

  getItem(productId: string): CartItem | undefined {
    return this.items.get(productId);
  }

  addItem(productId: string, quantity: number): void {
    const existingItem = this.items.get(productId);

    if (existingItem) {
      // 이미 존재하면 수량 증가
      existingItem.updateQuantity(existingItem.quantity + quantity);
    } else {
      // 새 아이템 추가
      this.items.set(productId, CartItem.create(productId, quantity));
    }
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.items.get(productId);
    if (!item) {
      throw new Error('장바구니에 해당 상품이 없습니다.');
    }

    item.updateQuantity(quantity);
  }

  removeItem(productId: string): void {
    const deleted = this.items.delete(productId);
    if (!deleted) {
      throw new Error('장바구니에 해당 상품이 없습니다.');
    }
  }

  clear(): void {
    this.items.clear();
  }

  isEmpty(): boolean {
    return this.items.size === 0;
  }

  getTotalItemCount(): number {
    return Array.from(this.items.values()).reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
  }

  toRedisData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (const [productId, item] of this.items.entries()) {
      data[productId] = item.quantity.toString();
    }
    return data;
  }
}
