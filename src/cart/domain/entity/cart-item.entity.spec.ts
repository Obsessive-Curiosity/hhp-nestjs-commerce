import { CartItem } from './cart-item.entity';

describe('CartItem', () => {
  describe('create', () => {
    it('장바구니 아이템을 생성할 수 있다', () => {
      // Given
      const productId = 'product-id';
      const quantity = 5;

      // When
      const cartItem = CartItem.create(productId, quantity);

      // Then
      expect(cartItem.productId).toBe(productId);
      expect(cartItem.quantity).toBe(quantity);
    });
  });

  describe('updateQuantity', () => {
    it('수량을 업데이트할 수 있다', () => {
      // Given
      const cartItem = CartItem.create('product-id', 5);
      const newQuantity = 10;

      // When
      cartItem.updateQuantity(newQuantity);

      // Then
      expect(cartItem.quantity).toBe(newQuantity);
    });
  });

  describe('toJSON', () => {
    it('JSON 형태로 변환할 수 있다', () => {
      // Given
      const productId = 'product-id';
      const quantity = 5;
      const cartItem = CartItem.create(productId, quantity);

      // When
      const json = cartItem.toJSON();

      // Then
      expect(json).toEqual({
        productId,
        quantity,
      });
    });
  });
});
