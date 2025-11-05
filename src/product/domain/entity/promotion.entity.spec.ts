import { Promotion } from './promotion.entity';

describe('Promotion Entity', () => {
  describe('create', () => {
    it('신규 프로모션을 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      };

      // When
      const promotion = Promotion.create(params);

      // Then
      expect(promotion.id).toBe(params.id);
      expect(promotion.productId).toBe(params.productId);
      expect(promotion.paidQuantity).toBe(params.paidQuantity);
      expect(promotion.freeQuantity).toBe(params.freeQuantity);
      expect(promotion.startAt).toEqual(params.startAt);
      expect(promotion.endAt).toEqual(params.endAt);
      expect(promotion.createdAt).toBeInstanceOf(Date);
      expect(promotion.updatedAt).toBeInstanceOf(Date);
    });

    it('종료일 없이 프로모션을 생성할 수 있다 (무제한)', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      };

      // When
      const promotion = Promotion.create(params);

      // Then
      expect(promotion.endAt).toBeNull();
    });
  });

  describe('비즈니스 로직', () => {
    let promotion: Promotion;

    beforeEach(() => {
      promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });
    });

    describe('getPromotionFormat', () => {
      it('프로모션 형식 문자열을 반환한다', () => {
        // When
        const format = promotion.getPromotionFormat();

        // Then
        expect(format).toBe('10+1');
      });

      it('다양한 수량 조합의 형식을 반환한다', () => {
        // Given
        const promotion2 = Promotion.create({
          id: 'test-promotion-id-2',
          productId: 'test-product-id',
          paidQuantity: 5,
          freeQuantity: 2,
          startAt: new Date('2025-01-01'),
        });

        // When
        const format = promotion2.getPromotionFormat();

        // Then
        expect(format).toBe('5+2');
      });
    });

    describe('isActive', () => {
      it('진행 중인 프로모션은 활성 상태다', () => {
        // Given
        const now = new Date('2025-06-01');

        // When & Then
        expect(promotion.isActive(now)).toBe(true);
      });

      it('시작일 당일은 활성 상태다', () => {
        // Given
        const now = new Date('2025-01-01');

        // When & Then
        expect(promotion.isActive(now)).toBe(true);
      });

      it('종료일 당일은 활성 상태다', () => {
        // Given
        const now = new Date('2025-12-31');

        // When & Then
        expect(promotion.isActive(now)).toBe(true);
      });
    });

    describe('isExpired', () => {
      it('종료일이 지난 프로모션은 만료 상태다', () => {
        // Given
        const now = new Date('2026-01-01');

        // When & Then
        expect(promotion.isExpired(now)).toBe(true);
      });

      it('종료일 이전 프로모션은 만료되지 않았다', () => {
        // Given
        const now = new Date('2025-06-01');

        // When & Then
        expect(promotion.isExpired(now)).toBe(false);
      });
    });

    describe('isNotStarted', () => {
      it('시작 전 프로모션은 시작되지 않았다', () => {
        // Given
        const now = new Date('2024-12-31');

        // When & Then
        expect(promotion.isNotStarted(now)).toBe(true);
      });

      it('시작일 이후 프로모션은 시작되었다', () => {
        // Given
        const now = new Date('2025-01-01');

        // When & Then
        expect(promotion.isNotStarted(now)).toBe(false);
      });
    });

    describe('calculateApplicableSets', () => {
      it('프로모션 적용 가능한 세트 수를 계산한다', () => {
        // When & Then
        expect(promotion.calculateApplicableSets(10)).toBe(1);
        expect(promotion.calculateApplicableSets(20)).toBe(2);
        expect(promotion.calculateApplicableSets(25)).toBe(2);
      });
    });

    describe('calculateFreeQuantity', () => {
      it('프로모션으로 받을 수 있는 무료 수량을 계산한다', () => {
        // When & Then
        expect(promotion.calculateFreeQuantity(10)).toBe(1); // 1세트
        expect(promotion.calculateFreeQuantity(20)).toBe(2); // 2세트
        expect(promotion.calculateFreeQuantity(25)).toBe(2); // 2세트 (나머지 5개는 무료 적용 안됨)
      });
    });

    describe('calculatePayableQuantity', () => {
      it('실제 지불해야 할 수량을 계산한다', () => {
        // When & Then
        expect(promotion.calculatePayableQuantity(11)).toBe(10); // 10개 구매 + 1개 무료
        expect(promotion.calculatePayableQuantity(22)).toBe(20); // 20개 구매 + 2개 무료
        expect(promotion.calculatePayableQuantity(25)).toBe(23); // 20개 구매 + 2개 무료 + 나머지 3개
      });
    });

    describe('updateInfo', () => {
      it('프로모션 정보를 수정할 수 있다', () => {
        // Given
        const newPaidQuantity = 5;
        const newFreeQuantity = 2;
        const newStartAt = new Date('2025-06-01');
        const newEndAt = new Date('2025-12-31');

        // When
        promotion.updateInfo({
          paidQuantity: newPaidQuantity,
          freeQuantity: newFreeQuantity,
          startAt: newStartAt,
          endAt: newEndAt,
        });

        // Then
        expect(promotion.paidQuantity).toBe(newPaidQuantity);
        expect(promotion.freeQuantity).toBe(newFreeQuantity);
        expect(promotion.startAt).toEqual(newStartAt);
        expect(promotion.endAt).toEqual(newEndAt);
        expect(promotion.getDirtyFields().has('paidQuantity')).toBe(true);
        expect(promotion.getDirtyFields().has('freeQuantity')).toBe(true);
        expect(promotion.getDirtyFields().has('startAt')).toBe(true);
        expect(promotion.getDirtyFields().has('endAt')).toBe(true);
        expect(promotion.getDirtyFields().has('updatedAt')).toBe(true);
      });

      it('종료일을 null로 변경할 수 있다 (무제한)', () => {
        // When
        promotion.updateInfo({ endAt: null });

        // Then
        expect(promotion.endAt).toBeNull();
      });
    });

    describe('더티 체킹', () => {
      it('변경된 필드를 추적할 수 있다', () => {
        // Given
        promotion.clearDirtyFields();
        expect(promotion.getDirtyFields().size).toBe(0);

        // When
        promotion.updateInfo({
          paidQuantity: 5,
          freeQuantity: 2,
        });

        // Then
        expect(promotion.getDirtyFields().has('paidQuantity')).toBe(true);
        expect(promotion.getDirtyFields().has('freeQuantity')).toBe(true);
        expect(promotion.getDirtyFields().has('updatedAt')).toBe(true);
      });

      it('더티 필드를 초기화할 수 있다', () => {
        // Given
        promotion.updateInfo({ paidQuantity: 5 });
        expect(promotion.getDirtyFields().size).toBeGreaterThan(0);

        // When
        promotion.clearDirtyFields();

        // Then
        expect(promotion.getDirtyFields().size).toBe(0);
      });
    });
  });
});
