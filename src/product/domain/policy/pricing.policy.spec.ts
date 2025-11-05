import { Product } from '../entity/product.entity';

describe('Pricing Policy', () => {
  describe('BR-006: B2B 가격은 B2C 가격보다 낮아야 함', () => {
    it('도매가가 소매가보다 낮으면 검증을 통과한다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
      };

      // When & Then
      expect(() => {
        Product.create(params);
      }).not.toThrow();
    });

    it('도매가가 소매가보다 높으면 상품을 생성할 수 없다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 8000,
        wholesalePrice: 10000,
        description: '테스트 상품 설명',
      };

      // When & Then
      expect(() => {
        Product.create(params);
      }).toThrow('B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.');
    });

    it('도매가와 소매가가 같으면 상품을 생성할 수 없다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 10000,
        description: '테스트 상품 설명',
      };

      // When & Then
      expect(() => {
        Product.create(params);
      }).toThrow('B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.');
    });

    it('상품 수정 시에도 도매가가 소매가보다 높으면 수정할 수 없다', () => {
      // Given
      const product = Product.create({
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
      });

      // When & Then
      expect(() => {
        product.updateInfo({
          retailPrice: 8000,
          wholesalePrice: 10000,
        });
      }).toThrow('B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.');
    });

    it('소매가만 있는 경우 검증을 통과한다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '소매 전용 상품',
        retailPrice: 10000,
        wholesalePrice: null,
        description: '테스트 상품 설명',
      };

      // When & Then
      expect(() => {
        Product.create(params);
      }).not.toThrow();
    });

    it('도매가만 있는 경우 검증을 통과한다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '도매 전용 상품',
        retailPrice: null,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
      };

      // When & Then
      expect(() => {
        Product.create(params);
      }).not.toThrow();
    });

    it('가격을 수정할 때 도매가만 변경해도 검증한다', () => {
      // Given
      const product = Product.create({
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
      });

      // When & Then
      expect(() => {
        product.updateInfo({ wholesalePrice: 11000 });
      }).toThrow('B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.');
    });

    it('가격을 수정할 때 소매가만 변경해도 검증한다', () => {
      // Given
      const product = Product.create({
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
      });

      // When & Then
      expect(() => {
        product.updateInfo({ retailPrice: 7000 });
      }).toThrow('B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.');
    });
  });
});
