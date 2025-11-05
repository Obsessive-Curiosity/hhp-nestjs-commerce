import { ProductStock } from './product-stock.entity';

describe('ProductStock Entity', () => {
  describe('create', () => {
    it('신규 재고를 생성할 수 있다', () => {
      // Given
      const productId = 'test-product-id';
      const initialQuantity = 100;

      // When
      const stock = ProductStock.create(productId, initialQuantity);

      // Then
      expect(stock.productId).toBe(productId);
      expect(stock.quantity).toBe(initialQuantity);
      expect(stock.version).toBe(0);
      expect(stock.createdAt).toBeInstanceOf(Date);
      expect(stock.updatedAt).toBeInstanceOf(Date);
    });

    it('초기 재고를 0으로 생성할 수 있다', () => {
      // Given
      const productId = 'test-product-id';

      // When
      const stock = ProductStock.create(productId, 0);

      // Then
      expect(stock.quantity).toBe(0);
      expect(stock.isOutOfStock()).toBe(true);
    });

    it('초기 재고를 지정하지 않으면 0으로 생성된다', () => {
      // Given
      const productId = 'test-product-id';

      // When
      const stock = ProductStock.create(productId);

      // Then
      expect(stock.quantity).toBe(0);
    });
  });

  describe('비즈니스 로직', () => {
    let stock: ProductStock;

    beforeEach(() => {
      stock = ProductStock.create('test-product-id', 100);
    });

    describe('decrease', () => {
      it('재고를 감소시킬 수 있다', () => {
        // Given
        const decreaseAmount = 30;
        const originalVersion = stock.version;

        // When
        stock.decrease(decreaseAmount);

        // Then
        expect(stock.quantity).toBe(70);
        expect(stock.version).toBe(originalVersion + 1);
        expect(stock.getDirtyFields().has('quantity')).toBe(true);
        expect(stock.getDirtyFields().has('version')).toBe(true);
        expect(stock.getDirtyFields().has('updatedAt')).toBe(true);
      });

      it('재고를 0까지 감소시킬 수 있다', () => {
        // When
        stock.decrease(100);

        // Then
        expect(stock.quantity).toBe(0);
        expect(stock.isOutOfStock()).toBe(true);
      });
    });

    describe('increase', () => {
      it('재고를 증가시킬 수 있다', () => {
        // Given
        const increaseAmount = 50;
        const originalVersion = stock.version;

        // When
        stock.increase(increaseAmount);

        // Then
        expect(stock.quantity).toBe(150);
        expect(stock.version).toBe(originalVersion + 1);
        expect(stock.getDirtyFields().has('quantity')).toBe(true);
        expect(stock.getDirtyFields().has('version')).toBe(true);
        expect(stock.getDirtyFields().has('updatedAt')).toBe(true);
      });
    });

    describe('hasStock', () => {
      it('요청 수량만큼 재고가 있으면 true를 반환한다', () => {
        // When & Then
        expect(stock.hasStock(50)).toBe(true);
        expect(stock.hasStock(100)).toBe(true);
      });

      it('요청 수량보다 재고가 적으면 false를 반환한다', () => {
        // When & Then
        expect(stock.hasStock(101)).toBe(false);
      });
    });

    describe('isOutOfStock', () => {
      it('재고가 0이면 true를 반환한다', () => {
        // Given
        stock.decrease(100);

        // When & Then
        expect(stock.isOutOfStock()).toBe(true);
      });

      it('재고가 0보다 크면 false를 반환한다', () => {
        // When & Then
        expect(stock.isOutOfStock()).toBe(false);
      });
    });

    describe('더티 체킹', () => {
      it('변경된 필드를 추적할 수 있다', () => {
        // Given
        stock.clearDirtyFields();
        expect(stock.getDirtyFields().size).toBe(0);

        // When
        stock.decrease(10);

        // Then
        expect(stock.getDirtyFields().has('quantity')).toBe(true);
        expect(stock.getDirtyFields().has('version')).toBe(true);
        expect(stock.getDirtyFields().has('updatedAt')).toBe(true);
      });

      it('더티 필드를 초기화할 수 있다', () => {
        // Given
        stock.decrease(10);
        expect(stock.getDirtyFields().size).toBeGreaterThan(0);

        // When
        stock.clearDirtyFields();

        // Then
        expect(stock.getDirtyFields().size).toBe(0);
      });
    });

    describe('버전 관리', () => {
      it('재고 변경 시 버전이 증가한다', () => {
        // Given
        const originalVersion = stock.version;

        // When
        stock.decrease(10);

        // Then
        expect(stock.version).toBe(originalVersion + 1);
      });

      it('여러 번 변경 시 버전이 계속 증가한다', () => {
        // Given
        const originalVersion = stock.version;

        // When
        stock.decrease(10);
        stock.increase(5);

        // Then
        expect(stock.version).toBe(originalVersion + 2);
      });
    });
  });
});
