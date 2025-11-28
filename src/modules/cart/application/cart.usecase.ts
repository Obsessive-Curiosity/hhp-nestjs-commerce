import { Injectable } from '@nestjs/common';
import { CartService } from '../domain/service/cart.service';
import { ProductService } from '../../product/domain/service/product.service';
import { StockService } from '../../product/domain/service/stock.service';
import { AddCartItemDto } from '../presentation/dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../presentation/dto/update-cart-item.dto';
import {
  CartResponseDto,
  CartItemBuilder,
  ProductWithStock,
} from '../presentation/dto/cart-response.dto';
import { Payload } from '@/common/types/express';

@Injectable()
export class CartUseCase {
  constructor(
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly stockService: StockService,
  ) {}

  // 장바구니 조회 (상품 정보와 함께)
  async getCartWithProducts(user: Payload): Promise<CartResponseDto> {
    const cart = await this.cartService.getCart(user.sub);
    const cartItems = cart.getItems();
    const isEmptyCart = cartItems.length === 0;

    if (isEmptyCart) {
      return {
        items: [],
        totalItems: 0,
        totalAmount: 0,
      };
    }

    // 상품 정보 조회 (병렬 처리)
    const productIds = cartItems.map((item) => item.productId);
    const productsData = await Promise.all(
      productIds.map((id) =>
        this.productService.findProductWithDetails(id, user.role),
      ),
    );

    // 상품 ID로 빠른 조회를 위한 Map 생성
    const productsMap = new Map<string, ProductWithStock>();
    productsData.forEach((product) => {
      if (product) {
        productsMap.set(product.id, {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stockQuantity: product.stockQuantity,
        });
      }
    });

    // 장바구니 아이템 응답 생성
    const items = cartItems
      .map((cartItem) => {
        const product = productsMap.get(cartItem.productId);
        if (!product) {
          return null; // 상품이 삭제되었거나 없는 경우 스킵
        }

        return CartItemBuilder.build(
          cartItem.productId,
          cartItem.quantity,
          product,
        );
      })
      .filter((item) => item !== null);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return {
      items,
      totalItems,
      totalAmount,
    };
  }

  // 장바구니에 상품 추가
  async addItem(userId: string, dto: AddCartItemDto): Promise<void> {
    const { productId, quantity } = dto;

    await this.productService.checkExistProduct(productId); // 1. 상품 존재 확인
    await this.stockService.checkStock(productId, quantity); // 2. 재고 확인
    await this.cartService.addItem(userId, productId, quantity); // 3. 장바구니에 추가
  }

  // 장바구니 상품 수량 수정
  async updateItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<void> {
    const { quantity } = dto;

    await this.productService.checkExistProduct(productId); // 1. 상품 존재 확인
    await this.stockService.checkStock(productId, quantity); // 2. 재고 확인
    await this.cartService.updateQuantity(userId, productId, quantity); // 3. 수량 업데이트
  }
}
