import { ProductStock } from '../entity/product-stock.entity';

describe('Stock Policy', () => {
  describe('재고 수량은 0 이상이어야 함', () => {
    it('초기 재고를 0 이상으로 생성할 수 있다', () => {
      // When & Then
      expect(() => {
        ProductStock.create('test-product-id', 0);
      }).not.toThrow();

      expect(() => {
        ProductStock.create('test-product-id', 100);
      }).not.toThrow();
    });

    it('초기 재고를 음수로 생성할 수 없다', () => {
      // When & Then
      expect(() => {
        ProductStock.create('test-product-id', -1);
      }).toThrow('초기 재고는 0 이상이어야 합니다.');

      expect(() => {
        ProductStock.create('test-product-id', -100);
      }).toThrow('초기 재고는 0 이상이어야 합니다.');
    });
  });

  describe('재고 감소는 양수여야 함', () => {
    it('양수로 재고를 감소시킬 수 있다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(() => {
        stock.decrease(10);
      }).not.toThrow();
    });

    it('0으로 재고를 감소시킬 수 없다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(() => {
        stock.decrease(0);
      }).toThrow('감소할 수량은 0보다 커야 합니다.');
    });

    it('음수로 재고를 감소시킬 수 없다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(() => {
        stock.decrease(-10);
      }).toThrow('감소할 수량은 0보다 커야 합니다.');
    });
  });

  describe('재고 증가는 양수여야 함', () => {
    it('양수로 재고를 증가시킬 수 있다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(() => {
        stock.increase(10);
      }).not.toThrow();
    });

    it('0으로 재고를 증가시킬 수 없다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(() => {
        stock.increase(0);
      }).toThrow('증가할 수량은 0보다 커야 합니다.');
    });

    it('음수로 재고를 증가시킬 수 없다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(() => {
        stock.increase(-10);
      }).toThrow('증가할 수량은 0보다 커야 합니다.');
    });
  });

  describe('재고 부족 검증', () => {
    it('현재 재고보다 많은 수량을 감소시킬 수 없다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(() => {
        stock.decrease(101);
      }).toThrow('재고가 부족합니다. 현재 재고: 100, 요청 수량: 101');
    });

    it('현재 재고와 같은 수량까지 감소시킬 수 있다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When
      stock.decrease(100);

      // Then
      expect(stock.quantity).toBe(0);
    });

    it('재고가 0일 때는 감소시킬 수 없다', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 0);

      // When & Then
      expect(() => {
        stock.decrease(1);
      }).toThrow('재고가 부족합니다. 현재 재고: 0, 요청 수량: 1');
    });
  });

  describe('재고 확인 정책', () => {
    it('요청 수량만큼 재고가 있으면 hasStock이 true', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(stock.hasStock(50)).toBe(true);
      expect(stock.hasStock(100)).toBe(true);
    });

    it('요청 수량보다 재고가 적으면 hasStock이 false', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 100);

      // When & Then
      expect(stock.hasStock(101)).toBe(false);
      expect(stock.hasStock(200)).toBe(false);
    });

    it('재고가 0이면 isOutOfStock이 true', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 0);

      // When & Then
      expect(stock.isOutOfStock()).toBe(true);
    });

    it('재고가 음수가 아닌 양수이면 isOutOfStock이 false', () => {
      // Given
      const stock = ProductStock.create('test-product-id', 1);

      // When & Then
      expect(stock.isOutOfStock()).toBe(false);
    });
  });
});
