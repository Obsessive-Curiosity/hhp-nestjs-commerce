import { CartItem } from './cart-item.entity';

describe('CartItem Policy', () => {
  describe('수량 검증 정책', () => {
    describe('create 시', () => {
      it('수량이 1 미만이면 예외를 발생시킨다', () => {
        // Given
        const productId = 'product-id';
        const quantity = 0;

        // When & Then
        expect(() => CartItem.create(productId, quantity)).toThrow(
          '수량은 1개 이상이어야 합니다.',
        );
      });

      it('수량이 정수가 아니면 예외를 발생시킨다', () => {
        // Given
        const productId = 'product-id';
        const quantity = 1.5;

        // When & Then
        expect(() => CartItem.create(productId, quantity)).toThrow(
          '수량은 정수여야 합니다.',
        );
      });

      it('음수 수량이면 예외를 발생시킨다', () => {
        // Given
        const productId = 'product-id';
        const quantity = -5;

        // When & Then
        expect(() => CartItem.create(productId, quantity)).toThrow(
          '수량은 1개 이상이어야 합니다.',
        );
      });
    });

    describe('updateQuantity 시', () => {
      it('수량이 1 미만이면 예외를 발생시킨다', () => {
        // Given
        const cartItem = CartItem.create('product-id', 5);
        const newQuantity = 0;

        // When & Then
        expect(() => cartItem.updateQuantity(newQuantity)).toThrow(
          '수량은 1개 이상이어야 합니다.',
        );
      });

      it('수량이 정수가 아니면 예외를 발생시킨다', () => {
        // Given
        const cartItem = CartItem.create('product-id', 5);
        const newQuantity = 2.5;

        // When & Then
        expect(() => cartItem.updateQuantity(newQuantity)).toThrow(
          '수량은 정수여야 합니다.',
        );
      });

      it('음수 수량으로 업데이트하면 예외를 발생시킨다', () => {
        // Given
        const cartItem = CartItem.create('product-id', 5);
        const newQuantity = -3;

        // When & Then
        expect(() => cartItem.updateQuantity(newQuantity)).toThrow(
          '수량은 1개 이상이어야 합니다.',
        );
      });
    });
  });
});
