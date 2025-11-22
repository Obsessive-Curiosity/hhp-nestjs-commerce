import { Inject, Injectable } from '@nestjs/common';
import { Cart } from '../entity/cart.entity';
import {
  CART_REPOSITORY,
  ICartRepository,
} from '../interface/cart.repository.interface';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 장바구니 조회 (없으면 생성)
  async getOrCreateCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    return cart ?? Cart.create(userId);
  }

  // 장바구니 조회
  async getCart(userId: string): Promise<Cart> {
    return this.getOrCreateCart(userId);
  }

  // ==================== 생성/수정 (Create/Update) ====================

  // 장바구니 상품 추가/수정
  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    // 부분 업데이트: Redis에서 직접 추가/수정
    await this.cartRepository.setItem(userId, productId, quantity);
  }

  // 장바구니 상품 수량 수정
  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    // 부분 업데이트: Redis에서 직접 수정
    await this.cartRepository.setItem(userId, productId, quantity);
  }

  // ==================== 삭제 (Delete) ====================

  // 장바구니 상품 삭제
  async removeItem(userId: string, productId: string): Promise<void> {
    await this.cartRepository.deleteItem(userId, productId);
  }

  // 장바구니 비우기
  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.delete(userId);
  }
}
