export interface ProductStockProps {
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export class ProductStock {
  private readonly _productId: string;
  private _quantity: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _version: number;

  // 더티 체킹
  private _dirtyFields: Set<string> = new Set();

  constructor(props: ProductStockProps) {
    this._productId = props.productId;
    this._quantity = props.quantity;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._version = props.version;
  }

  // Getters
  get productId(): string {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get version(): number {
    return this._version;
  }

  // 더티 체킹 관련 메서드
  getDirtyFields(): Set<string> {
    return this._dirtyFields;
  }

  clearDirtyFields(): void {
    this._dirtyFields.clear();
  }

  // 재고 확인
  hasStock(quantity: number): boolean {
    return this._quantity >= quantity;
  }

  // 재고 부족 확인
  isOutOfStock(): boolean {
    return this._quantity <= 0;
  }

  // 재고 감소
  decrease(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('감소할 수량은 0보다 커야 합니다.');
    }

    if (this._quantity < quantity) {
      throw new Error(
        `재고가 부족합니다. 현재 재고: ${this._quantity}, 요청 수량: ${quantity}`,
      );
    }

    this._quantity -= quantity;
    this._version += 1;
    this._updatedAt = new Date();
    this._dirtyFields.add('quantity');
    this._dirtyFields.add('version');
    this._dirtyFields.add('updatedAt');
  }

  // 재고 증가
  increase(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('증가할 수량은 0보다 커야 합니다.');
    }

    this._quantity += quantity;
    this._version += 1;
    this._updatedAt = new Date();
    this._dirtyFields.add('quantity');
    this._dirtyFields.add('version');
    this._dirtyFields.add('updatedAt');
  }

  // Factory 메서드: 신규 재고 생성
  static create(productId: string, initialQuantity: number = 0): ProductStock {
    if (initialQuantity < 0) {
      throw new Error('초기 재고는 0 이상이어야 합니다.');
    }

    const now = new Date();
    return new ProductStock({
      productId,
      quantity: initialQuantity,
      createdAt: now,
      updatedAt: now,
      version: 0,
    });
  }
}
