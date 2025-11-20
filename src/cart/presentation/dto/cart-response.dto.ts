export class CartItemResponseDto {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // User role에 따라 retailPrice or wholesalePrice
  imageUrl?: string;
  availableStock: number;
  isStockSufficient: boolean;
}

export class CartResponseDto {
  items: CartItemResponseDto[];
  totalItems: number;
  totalAmount: number;
}

export interface ProductWithStock {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  stockQuantity: number;
}

export class CartItemBuilder {
  static build(
    productId: string,
    quantity: number,
    product: ProductWithStock,
  ): CartItemResponseDto {
    const isStockSufficient = product.stockQuantity >= quantity;

    return {
      productId,
      productName: product.name,
      quantity,
      price: product.price,
      imageUrl: product.imageUrl ?? undefined,
      availableStock: product.stockQuantity,
      isStockSufficient,
    };
  }
}
