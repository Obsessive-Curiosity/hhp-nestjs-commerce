import { Cart } from './cart.entity';

describe('Cart', () => {
  const userId = 'user-id';

  describe('create', () => {
    it('빈 장바구니를 생성할 수 있다', () => {
      // When
      const cart = Cart.create(userId);

      // Then
      expect(cart.userId).toBe(userId);
      expect(cart.isEmpty()).toBe(true);
      expect(cart.getItems()).toHaveLength(0);
    });
  });

  describe('fromRedisData', () => {
    it('Redis 데이터로부터 장바구니를 생성할 수 있다', () => {
      // Given
      const redisData = {
        'product-1': '5',
        'product-2': '3',
      };

      // When
      const cart = Cart.fromRedisData(userId, redisData);

      // Then
      expect(cart.userId).toBe(userId);
      expect(cart.getItems()).toHaveLength(2);
      expect(cart.getItem('product-1')?.quantity).toBe(5);
      expect(cart.getItem('product-2')?.quantity).toBe(3);
    });

    it('빈 Redis 데이터로부터 빈 장바구니를 생성할 수 있다', () => {
      // Given
      const redisData = {};

      // When
      const cart = Cart.fromRedisData(userId, redisData);

      // Then
      expect(cart.userId).toBe(userId);
      expect(cart.isEmpty()).toBe(true);
    });
  });

  describe('addItem', () => {
    it('새로운 상품을 추가할 수 있다', () => {
      // Given
      const cart = Cart.create(userId);
      const productId = 'product-id';
      const quantity = 5;

      // When
      cart.addItem(productId, quantity);

      // Then
      expect(cart.getItems()).toHaveLength(1);
      expect(cart.getItem(productId)?.quantity).toBe(quantity);
    });
  });

  describe('updateQuantity', () => {
    it('상품의 수량을 업데이트할 수 있다', () => {
      // Given
      const cart = Cart.create(userId);
      const productId = 'product-id';
      cart.addItem(productId, 5);

      // When
      cart.updateQuantity(productId, 10);

      // Then
      expect(cart.getItem(productId)?.quantity).toBe(10);
    });
  });

  describe('removeItem', () => {
    it('상품을 삭제할 수 있다', () => {
      // Given
      const cart = Cart.create(userId);
      const productId = 'product-id';
      cart.addItem(productId, 5);

      // When
      cart.removeItem(productId);

      // Then
      expect(cart.getItems()).toHaveLength(0);
      expect(cart.getItem(productId)).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('장바구니를 비울 수 있다', () => {
      // Given
      const cart = Cart.create(userId);
      cart.addItem('product-1', 5);
      cart.addItem('product-2', 3);

      // When
      cart.clear();

      // Then
      expect(cart.isEmpty()).toBe(true);
      expect(cart.getItems()).toHaveLength(0);
    });
  });

  describe('isEmpty', () => {
    it('빈 장바구니면 true를 반환한다', () => {
      // Given
      const cart = Cart.create(userId);

      // When & Then
      expect(cart.isEmpty()).toBe(true);
    });

    it('아이템이 있는 장바구니면 false를 반환한다', () => {
      // Given
      const cart = Cart.create(userId);
      cart.addItem('product-id', 5);

      // When & Then
      expect(cart.isEmpty()).toBe(false);
    });
  });

  describe('getTotalItemCount', () => {
    it('전체 상품 수량을 계산할 수 있다', () => {
      // Given
      const cart = Cart.create(userId);
      cart.addItem('product-1', 5);
      cart.addItem('product-2', 3);

      // When
      const totalCount = cart.getTotalItemCount();

      // Then
      expect(totalCount).toBe(8);
    });

    it('빈 장바구니의 전체 수량은 0이다', () => {
      // Given
      const cart = Cart.create(userId);

      // When
      const totalCount = cart.getTotalItemCount();

      // Then
      expect(totalCount).toBe(0);
    });
  });

  describe('toRedisData', () => {
    it('Redis 데이터 형태로 변환할 수 있다', () => {
      // Given
      const cart = Cart.create(userId);
      cart.addItem('product-1', 5);
      cart.addItem('product-2', 3);

      // When
      const redisData = cart.toRedisData();

      // Then
      expect(redisData).toEqual({
        'product-1': '5',
        'product-2': '3',
      });
    });

    it('빈 장바구니는 빈 객체로 변환된다', () => {
      // Given
      const cart = Cart.create(userId);

      // When
      const redisData = cart.toRedisData();

      // Then
      expect(redisData).toEqual({});
    });
  });

  describe('getItem', () => {
    it('특정 상품을 조회할 수 있다', () => {
      // Given
      const cart = Cart.create(userId);
      const productId = 'product-id';
      cart.addItem(productId, 5);

      // When
      const item = cart.getItem(productId);

      // Then
      expect(item).toBeDefined();
      expect(item?.productId).toBe(productId);
      expect(item?.quantity).toBe(5);
    });
  });
});
