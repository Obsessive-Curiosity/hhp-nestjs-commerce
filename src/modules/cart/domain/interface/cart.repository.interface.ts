import { Cart } from '../entity/cart.entity';

export interface ICartRepository {
  /**
   * 사용자의 장바구니 조회
   */
  findByUserId(userId: string): Promise<Cart | null>;

  /**
   * 장바구니에 상품 추가/수정 (부분 업데이트)
   */
  setItem(userId: string, productId: string, quantity: number): Promise<void>;

  /**
   * 장바구니에서 특정 상품 제거
   */
  deleteItem(userId: string, productId: string): Promise<void>;

  /**
   * 장바구니 전체 삭제
   */
  delete(userId: string): Promise<void>;
}

export const CART_REPOSITORY = Symbol('CART_REPOSITORY');
