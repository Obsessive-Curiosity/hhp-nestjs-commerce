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

  async getOrCreateCart(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findByUserId(userId);
    return cart ?? Cart.create(userId);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    // 부분 업데이트: Redis에서 직접 추가/수정
    await this.cartRepository.setItem(userId, productId, quantity);
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    // 부분 업데이트: Redis에서 직접 수정
    await this.cartRepository.setItem(userId, productId, quantity);
  }

  async removeItem(userId: string, productId: string): Promise<void> {
    await this.cartRepository.deleteItem(userId, productId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.delete(userId);
  }

  async getCart(userId: string): Promise<Cart> {
    return this.getOrCreateCart(userId);
  }
}
