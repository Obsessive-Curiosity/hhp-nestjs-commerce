import { Role } from '@/user/domain/entity/user.entity';

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
  retailPrice: number;
  wholesalePrice: number;
  imageUrl?: string | null;
  stock: {
    quantity: number;
  } | null;
}

export class CartItemBuilder {
  static build(
    productId: string,
    quantity: number,
    product: ProductWithStock,
    userRole: Role,
  ): CartItemResponseDto {
    const price =
      userRole === Role.WHOLESALER
        ? product.wholesalePrice
        : product.retailPrice;

    const availableStock = product.stock?.quantity ?? 0;
    const isStockSufficient = availableStock >= quantity;

    return {
      productId,
      productName: product.name,
      quantity,
      price,
      imageUrl: product.imageUrl ?? undefined,
      availableStock,
      isStockSufficient,
    };
  }
}
