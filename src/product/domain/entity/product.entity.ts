import { Category, ProductStock } from '@prisma/client';

export interface ProductProps {
  id: string;
  categoryId: number;
  name: string;
  retailPrice: number | null;
  wholesalePrice: number | null;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // Relations
  category?: Category;
  stock?: ProductStock | null;
}

export class Product {
  private readonly _id: string;
  private _categoryId: number;
  private _name: string;
  private _retailPrice: number | null;
  private _wholesalePrice: number | null;
  private _description: string;
  private _imageUrl: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date | null;

  // Relations
  private _category?: Category;
  private _stock?: ProductStock | null;

  // 더티 체킹
  private _dirtyFields: Set<string> = new Set();

  constructor(props: ProductProps) {
    this._id = props.id;
    this._categoryId = props.categoryId;
    this._name = props.name;
    this._retailPrice = props.retailPrice;
    this._wholesalePrice = props.wholesalePrice;
    this._description = props.description;
    this._imageUrl = props.imageUrl;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;

    // Relations
    this._category = props.category;
    this._stock = props.stock;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get categoryId(): number {
    return this._categoryId;
  }

  get name(): string {
    return this._name;
  }

  get retailPrice(): number | null {
    return this._retailPrice;
  }

  get wholesalePrice(): number | null {
    return this._wholesalePrice;
  }

  get description(): string {
    return this._description;
  }

  get imageUrl(): string | null {
    return this._imageUrl;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this._deletedAt;
  }

  get category(): Category | undefined {
    return this._category;
  }

  get stock(): ProductStock | null | undefined {
    return this._stock;
  }

  // 더티 체킹 관련 메서드
  getDirtyFields(): Set<string> {
    return this._dirtyFields;
  }

  clearDirtyFields(): void {
    this._dirtyFields.clear();
  }

  // 삭제 여부 확인
  isDeleted(): boolean {
    return this._deletedAt !== null && this._deletedAt !== undefined;
  }

  // 활성 상품 확인
  isActive(): boolean {
    return !this.isDeleted();
  }

  // 재고 확인
  hasStock(quantity: number): boolean {
    if (!this._stock) return false;
    return this._stock.quantity >= quantity;
  }

  // 재고 없음 확인
  isOutOfStock(): boolean {
    if (!this._stock) return true;
    return this._stock.quantity <= 0;
  }

  // BR-006: B2B 가격은 B2C보다 낮아야 함
  validatePricing(): void {
    if (this._retailPrice && this._wholesalePrice) {
      if (this._wholesalePrice >= this._retailPrice) {
        throw new Error(
          'B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.',
        );
      }
    }
  }

  // 상품 정보 업데이트
  updateInfo(params: {
    name?: string;
    categoryId?: number;
    retailPrice?: number | null;
    wholesalePrice?: number | null;
    description?: string;
    imageUrl?: string | null;
  }): void {
    if (this.isDeleted()) {
      throw new Error('삭제된 상품은 수정할 수 없습니다.');
    }

    if (params.name !== undefined) {
      this._name = params.name;
      this._dirtyFields.add('name');
    }
    if (params.categoryId !== undefined) {
      this._categoryId = params.categoryId;
      this._dirtyFields.add('categoryId');
    }
    if (params.retailPrice !== undefined) {
      this._retailPrice = params.retailPrice;
      this._dirtyFields.add('retailPrice');
    }
    if (params.wholesalePrice !== undefined) {
      this._wholesalePrice = params.wholesalePrice;
      this._dirtyFields.add('wholesalePrice');
    }
    if (params.description !== undefined) {
      this._description = params.description;
      this._dirtyFields.add('description');
    }
    if (params.imageUrl !== undefined) {
      this._imageUrl = params.imageUrl;
      this._dirtyFields.add('imageUrl');
    }

    // 가격 검증
    this.validatePricing();

    this._updatedAt = new Date();
    this._dirtyFields.add('updatedAt');
  }

  // Soft Delete
  delete(): void {
    if (this.isDeleted()) {
      throw new Error('이미 삭제된 상품입니다.');
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
    this._dirtyFields.add('deletedAt');
    this._dirtyFields.add('updatedAt');
  }

  // Factory 메서드: 신규 상품 생성
  static create(params: {
    id: string;
    categoryId: number;
    name: string;
    retailPrice: number | null;
    wholesalePrice: number | null;
    description: string;
    imageUrl?: string | null;
  }): Product {
    const now = new Date();
    const product = new Product({
      id: params.id,
      categoryId: params.categoryId,
      name: params.name,
      retailPrice: params.retailPrice,
      wholesalePrice: params.wholesalePrice,
      description: params.description,
      imageUrl: params.imageUrl ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    // BR-006: 가격 검증
    product.validatePricing();

    return product;
  }
}
