import { Product } from '@/modules/product/domain/entity/product.entity';
import { StockResponseDto } from './stock-response.dto';
import { ProductWithDetails } from '@/modules/product/domain/interface/product.repository.interface';

// 상품 목록 아이템 (간단한 정보)
export class ProductListItemResponseDto {
  id: string;
  category: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  hasStock: boolean;

  static fromProductWithDetails(
    data: ProductWithDetails,
  ): ProductListItemResponseDto {
    const dto = new ProductListItemResponseDto();
    dto.id = data.id;
    dto.category = data.categoryName;
    dto.name = data.name;
    dto.price = data.price;
    dto.description = null;
    dto.imageUrl = data.imageUrl;
    dto.hasStock = data.stockQuantity > 0;
    return dto;
  }
}

// 상품 상세 정보
export class ProductDetailResponseDto {
  id: string;
  category: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  stock: StockResponseDto | null;
  createdAt: Date;
  updatedAt: Date;

  static fromProductWithDetails(
    data: ProductWithDetails,
  ): ProductDetailResponseDto {
    const dto = new ProductDetailResponseDto();
    dto.id = data.id;
    dto.category = data.categoryName;
    dto.name = data.name;
    dto.price = data.price;
    dto.description = data.description ?? null;
    dto.imageUrl = data.imageUrl;
    dto.stock = null;
    dto.createdAt = data.createdAt;
    dto.updatedAt = data.updatedAt;
    return dto;
  }
}

// 상품 생성 응답
export class CreateProductResponseDto {
  id: string;
  categoryId: number;
  name: string;
  retailPrice: number | null;
  wholesalePrice: number | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date;

  static from(product: Product): CreateProductResponseDto {
    const dto = new CreateProductResponseDto();
    dto.id = product.id;
    dto.categoryId = product.categoryId;
    dto.name = product.name;
    dto.retailPrice = product.retailPrice;
    dto.wholesalePrice = product.wholesalePrice;
    dto.description = product.description ?? null;
    dto.imageUrl = product.imageUrl ?? null;
    dto.createdAt = product.createdAt;
    return dto;
  }
}

// 상품 수정 응답
export class UpdateProductResponseDto {
  id: string;
  categoryId: number;
  name: string;
  retailPrice: number | null;
  wholesalePrice: number | null;
  description: string | null;
  imageUrl: string | null;
  updatedAt: Date;

  static from(product: Product): UpdateProductResponseDto {
    const dto = new UpdateProductResponseDto();
    dto.id = product.id;
    dto.categoryId = product.categoryId;
    dto.name = product.name;
    dto.retailPrice = product.retailPrice;
    dto.wholesalePrice = product.wholesalePrice;
    dto.description = product.description ?? null;
    dto.imageUrl = product.imageUrl ?? null;
    dto.updatedAt = product.updatedAt;
    return dto;
  }
}
