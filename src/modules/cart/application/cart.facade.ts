import { Injectable } from '@nestjs/common';
import { CartService } from '../domain/service/cart.service';
import { AddCartItemDto } from '../presentation/dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../presentation/dto/update-cart-item.dto';
import { CartResponseDto } from '../presentation/dto/cart-response.dto';
import { Payload } from '@/common/types/express';
import { CartUseCase } from './cart.usecase';

@Injectable()
export class CartFacade {
  constructor(
    private readonly cartService: CartService,
    private readonly cartUseCase: CartUseCase,
  ) {}

  // 장바구니 조회 (상품 정보와 함께)
  async getCart(user: Payload): Promise<CartResponseDto> {
    return this.cartUseCase.getCartWithProducts(user);
  }

  // 장바구니에 상품 추가
  async addItem(userId: string, dto: AddCartItemDto): Promise<void> {
    return this.cartUseCase.addItem(userId, dto);
  }

  // 장바구니 상품 수량 수정
  async updateItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<void> {
    return this.cartUseCase.updateItem(userId, productId, dto);
  }

  // 장바구니에서 상품 제거
  async removeItem(userId: string, productId: string): Promise<void> {
    await this.cartService.removeItem(userId, productId);
  }

  // 장바구니 비우기
  async clearCart(userId: string): Promise<void> {
    await this.cartService.clearCart(userId);
  }
}
