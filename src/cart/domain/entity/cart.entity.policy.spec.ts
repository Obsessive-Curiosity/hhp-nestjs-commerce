import { Cart } from './cart.entity';

describe('Cart Policy', () => {
  const userId = 'user-id';

  describe('아이템 관리 정책', () => {
    describe('중복 상품 추가 정책', () => {
      it('이미 존재하는 상품을 추가하면 수량을 증가시킨다', () => {
        // Given
        const cart = Cart.create(userId);
        const productId = 'product-id';
        cart.addItem(productId, 5);

        // When
        cart.addItem(productId, 3);

        // Then
        expect(cart.getItems()).toHaveLength(1);
        expect(cart.getItem(productId)?.quantity).toBe(8);
      });

      it('다른 상품을 추가하면 별도 아이템으로 추가된다', () => {
        // Given
        const cart = Cart.create(userId);
        cart.addItem('product-1', 5);

        // When
        cart.addItem('product-2', 3);

        // Then
        expect(cart.getItems()).toHaveLength(2);
        expect(cart.getItem('product-1')?.quantity).toBe(5);
        expect(cart.getItem('product-2')?.quantity).toBe(3);
      });
    });

    describe('존재하지 않는 상품 처리 정책', () => {
      it('존재하지 않는 상품의 수량을 업데이트하면 예외를 발생시킨다', () => {
        // Given
        const cart = Cart.create(userId);

        // When & Then
        expect(() => cart.updateQuantity('non-existent-product', 10)).toThrow(
          '장바구니에 해당 상품이 없습니다.',
        );
      });

      it('존재하지 않는 상품을 삭제하면 예외를 발생시킨다', () => {
        // Given
        const cart = Cart.create(userId);

        // When & Then
        expect(() => cart.removeItem('non-existent-product')).toThrow(
          '장바구니에 해당 상품이 없습니다.',
        );
      });
    });

    describe('아이템 조회 정책', () => {
      it('존재하지 않는 상품 조회 시 undefined를 반환한다', () => {
        // Given
        const cart = Cart.create(userId);

        // When
        const item = cart.getItem('non-existent-product');

        // Then
        expect(item).toBeUndefined();
      });
    });
  });
});
