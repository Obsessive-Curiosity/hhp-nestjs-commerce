import { Product } from '@/product/domain/entity/product.entity';
import { Role } from '@/user/domain/entity/user.entity';
import { StockResponseDto } from './stock-response.dto';

// 상품 목록 아이템 (간단한 정보)
export class ProductListItemResponseDto {
  id: string;
  category: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  hasStock: boolean;

  static from(product: Product, role?: Role): ProductListItemResponseDto {
    const dto = new ProductListItemResponseDto();
    dto.id = product.id;
    dto.category = product.category.name;
    dto.name = product.name;
    dto.price = product.getPrice(role);
    dto.description = product.description ?? null;
    dto.imageUrl = product.imageUrl ?? null;
    dto.hasStock = product.stock ? product.stock.quantity > 0 : false;
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

  static from(product: Product, role?: Role): ProductDetailResponseDto {
    const dto = new ProductDetailResponseDto();
    dto.id = product.id;
    dto.category = product.category.name;
    dto.name = product.name;
    dto.price = product.getPrice(role);
    dto.description = product.description ?? null;
    dto.imageUrl = product.imageUrl ?? null;
    dto.stock = product.stock ? StockResponseDto.from(product.stock) : null;
    dto.createdAt = product.createdAt;
    dto.updatedAt = product.updatedAt;
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
