import { Product } from './product.entity';

describe('Product Entity', () => {
  describe('create', () => {
    it('신규 상품을 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
        imageUrl: 'https://example.com/image.jpg',
      };

      // When
      const product = Product.create(params);

      // Then
      expect(product.id).toBe(params.id);
      expect(product.categoryId).toBe(params.categoryId);
      expect(product.name).toBe(params.name);
      expect(product.retailPrice).toBe(params.retailPrice);
      expect(product.wholesalePrice).toBe(params.wholesalePrice);
      expect(product.description).toBe(params.description);
      expect(product.imageUrl).toBe(params.imageUrl);
      expect(product.isDeleted()).toBe(false);
      expect(product.isActive()).toBe(true);
    });

    it('이미지 URL 없이 상품을 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
      };

      // When
      const product = Product.create(params);

      // Then
      expect(product.imageUrl).toBeNull();
    });

    it('소매가만 있는 상품을 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '소매 전용 상품',
        retailPrice: 10000,
        wholesalePrice: null,
        description: '테스트 상품 설명',
      };

      // When
      const product = Product.create(params);

      // Then
      expect(product.retailPrice).toBe(10000);
      expect(product.wholesalePrice).toBeNull();
    });

    it('도매가만 있는 상품을 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-product-id',
        categoryId: 1,
        name: '도매 전용 상품',
        retailPrice: null,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
      };

      // When
      const product = Product.create(params);

      // Then
      expect(product.retailPrice).toBeNull();
      expect(product.wholesalePrice).toBe(8000);
    });
  });

  describe('비즈니스 로직', () => {
    let product: Product;

    beforeEach(() => {
      product = Product.create({
        id: 'test-product-id',
        categoryId: 1,
        name: '테스트 상품',
        retailPrice: 10000,
        wholesalePrice: 8000,
        description: '테스트 상품 설명',
        imageUrl: 'https://example.com/image.jpg',
      });
    });

    describe('updateInfo', () => {
      it('상품 정보를 수정할 수 있다', () => {
        // Given
        const newName = '수정된 상품명';
        const newDescription = '수정된 설명';
        const newRetailPrice = 15000;
        const newWholesalePrice = 12000;

        // When
        product.updateInfo({
          name: newName,
          description: newDescription,
          retailPrice: newRetailPrice,
          wholesalePrice: newWholesalePrice,
        });

        // Then
        expect(product.name).toBe(newName);
        expect(product.description).toBe(newDescription);
        expect(product.retailPrice).toBe(newRetailPrice);
        expect(product.wholesalePrice).toBe(newWholesalePrice);
        expect(product.getDirtyFields().has('name')).toBe(true);
        expect(product.getDirtyFields().has('description')).toBe(true);
        expect(product.getDirtyFields().has('retailPrice')).toBe(true);
        expect(product.getDirtyFields().has('wholesalePrice')).toBe(true);
      });

      it('카테고리를 변경할 수 있다', () => {
        // Given
        const newCategoryId = 2;

        // When
        product.updateInfo({ categoryId: newCategoryId });

        // Then
        expect(product.categoryId).toBe(newCategoryId);
        expect(product.getDirtyFields().has('categoryId')).toBe(true);
      });

      it('이미지 URL을 변경할 수 있다', () => {
        // Given
        const newImageUrl = 'https://example.com/new-image.jpg';

        // When
        product.updateInfo({ imageUrl: newImageUrl });

        // Then
        expect(product.imageUrl).toBe(newImageUrl);
        expect(product.getDirtyFields().has('imageUrl')).toBe(true);
      });

      it('삭제된 상품은 수정할 수 없다', () => {
        // Given
        product.delete();

        // When & Then
        expect(() => {
          product.updateInfo({ name: '새 이름' });
        }).toThrow('삭제된 상품은 수정할 수 없습니다.');
      });
    });

    describe('delete', () => {
      it('상품을 삭제할 수 있다 (Soft Delete)', () => {
        // Given
        expect(product.isActive()).toBe(true);
        expect(product.isDeleted()).toBe(false);

        // When
        product.delete();

        // Then
        expect(product.isDeleted()).toBe(true);
        expect(product.isActive()).toBe(false);
        expect(product.deletedAt).toBeInstanceOf(Date);
        expect(product.getDirtyFields().has('deletedAt')).toBe(true);
      });

      it('이미 삭제된 상품은 다시 삭제할 수 없다', () => {
        // Given
        product.delete();

        // When & Then
        expect(() => {
          product.delete();
        }).toThrow('이미 삭제된 상품입니다.');
      });
    });

    describe('재고 확인', () => {
      it('재고가 있으면 hasStock이 true를 반환한다', () => {
        // Given
        const productWithStock = new Product({
          id: 'test-product-id',
          categoryId: 1,
          name: '테스트 상품',
          retailPrice: 10000,
          wholesalePrice: 8000,
          description: '테스트 상품 설명',
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          stock: {
            productId: 'test-product-id',
            quantity: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 0,
          },
        });

        // When & Then
        expect(productWithStock.hasStock(50)).toBe(true);
        expect(productWithStock.hasStock(100)).toBe(true);
        expect(productWithStock.hasStock(101)).toBe(false);
      });

      it('재고 정보가 없으면 hasStock이 false를 반환한다', () => {
        // When & Then
        expect(product.hasStock(1)).toBe(false);
      });

      it('재고가 0이면 isOutOfStock이 true를 반환한다', () => {
        // Given
        const productWithoutStock = new Product({
          id: 'test-product-id',
          categoryId: 1,
          name: '테스트 상품',
          retailPrice: 10000,
          wholesalePrice: 8000,
          description: '테스트 상품 설명',
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          stock: {
            productId: 'test-product-id',
            quantity: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 0,
          },
        });

        // When & Then
        expect(productWithoutStock.isOutOfStock()).toBe(true);
      });

      it('재고 정보가 없으면 isOutOfStock이 true를 반환한다', () => {
        // When & Then
        expect(product.isOutOfStock()).toBe(true);
      });
    });

    describe('더티 체킹', () => {
      it('변경된 필드를 추적할 수 있다', () => {
        // Given
        product.clearDirtyFields();
        expect(product.getDirtyFields().size).toBe(0);

        // When
        product.updateInfo({
          name: '새 이름',
          description: '새 설명',
        });

        // Then
        expect(product.getDirtyFields().has('name')).toBe(true);
        expect(product.getDirtyFields().has('description')).toBe(true);
        expect(product.getDirtyFields().has('updatedAt')).toBe(true);
      });

      it('더티 필드를 초기화할 수 있다', () => {
        // Given
        product.updateInfo({ name: '새 이름' });
        expect(product.getDirtyFields().size).toBeGreaterThan(0);

        // When
        product.clearDirtyFields();

        // Then
        expect(product.getDirtyFields().size).toBe(0);
      });
    });
  });
});
