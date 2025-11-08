import { Promotion } from '../entity/promotion.entity';

describe('Promotion Policy', () => {
  describe('프로모션 수량 정책', () => {
    it('유료 수량이 1 이상이어야 한다', () => {
      // Given
      const validParams = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 1,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      };

      // When & Then
      expect(() => {
        Promotion.create(validParams);
      }).not.toThrow();
    });

    it('유료 수량이 0이면 프로모션을 생성할 수 없다', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 0,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      };

      // When & Then
      expect(() => {
        Promotion.create(params);
      }).toThrow('유료 수량은 0보다 커야 합니다.');
    });

    it('유료 수량이 음수이면 프로모션을 생성할 수 없다', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: -1,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      };

      // When & Then
      expect(() => {
        Promotion.create(params);
      }).toThrow('유료 수량은 0보다 커야 합니다.');
    });

    it('무료 수량이 1 이상이어야 한다', () => {
      // Given
      const validParams = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      };

      // When & Then
      expect(() => {
        Promotion.create(validParams);
      }).not.toThrow();
    });

    it('무료 수량이 0이면 프로모션을 생성할 수 없다', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 0,
        startAt: new Date('2025-01-01'),
      };

      // When & Then
      expect(() => {
        Promotion.create(params);
      }).toThrow('무료 수량은 0보다 커야 합니다.');
    });

    it('무료 수량이 음수이면 프로모션을 생성할 수 없다', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: -1,
        startAt: new Date('2025-01-01'),
      };

      // When & Then
      expect(() => {
        Promotion.create(params);
      }).toThrow('무료 수량은 0보다 커야 합니다.');
    });

    it('수정 시에도 유료 수량은 1 이상이어야 한다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      });

      // When & Then
      expect(() => {
        promotion.updateInfo({ paidQuantity: 0 });
      }).toThrow('유료 수량은 0보다 커야 합니다.');
    });

    it('수정 시에도 무료 수량은 1 이상이어야 한다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      });

      // When & Then
      expect(() => {
        promotion.updateInfo({ freeQuantity: 0 });
      }).toThrow('무료 수량은 0보다 커야 합니다.');
    });
  });

  describe('프로모션 기간 정책', () => {
    it('종료일이 시작일보다 나중이어야 한다', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      };

      // When & Then
      expect(() => {
        Promotion.create(params);
      }).not.toThrow();
    });

    it('종료일이 시작일보다 이전이면 프로모션을 생성할 수 없다', () => {
      // Given
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-12-31'),
        endAt: new Date('2025-01-01'),
      };

      // When & Then
      expect(() => {
        Promotion.create(params);
      }).toThrow('프로모션 종료일은 시작일보다 나중이어야 합니다.');
    });

    it('종료일이 시작일과 같으면 프로모션을 생성할 수 없다', () => {
      // Given
      const date = new Date('2025-01-01');
      const params = {
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: date,
        endAt: date,
      };

      // When & Then
      expect(() => {
        Promotion.create(params);
      }).toThrow('프로모션 종료일은 시작일보다 나중이어야 합니다.');
    });

    it('종료일이 없으면 무제한 프로모션으로 생성할 수 있다', () => {
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

    it('수정 시에도 종료일은 시작일보다 나중이어야 한다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });

      // When & Then
      expect(() => {
        promotion.updateInfo({
          startAt: new Date('2025-12-31'),
          endAt: new Date('2025-01-01'),
        });
      }).toThrow('프로모션 종료일은 시작일보다 나중이어야 합니다.');
    });
  });

  describe('프로모션 활성화 정책', () => {
    it('시작일과 종료일 사이는 활성 상태다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });
      const now = new Date('2025-06-01');

      // When & Then
      expect(promotion.isActive(now)).toBe(true);
      expect(promotion.isExpired(now)).toBe(false);
      expect(promotion.isNotStarted(now)).toBe(false);
    });

    it('시작일 당일은 활성 상태다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });
      const now = new Date('2025-01-01');

      // When & Then
      expect(promotion.isActive(now)).toBe(true);
      expect(promotion.isNotStarted(now)).toBe(false);
    });

    it('종료일 당일은 활성 상태다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });
      const now = new Date('2025-12-31');

      // When & Then
      expect(promotion.isActive(now)).toBe(true);
      expect(promotion.isExpired(now)).toBe(false);
    });

    it('시작 전에는 비활성 상태다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });
      const now = new Date('2024-12-31');

      // When & Then
      expect(promotion.isActive(now)).toBe(false);
      expect(promotion.isNotStarted(now)).toBe(true);
      expect(promotion.isExpired(now)).toBe(false);
    });

    it('종료 후에는 비활성 상태이며 만료된 것으로 간주한다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });
      const now = new Date('2026-01-01');

      // When & Then
      expect(promotion.isActive(now)).toBe(false);
      expect(promotion.isExpired(now)).toBe(true);
      expect(promotion.isNotStarted(now)).toBe(false);
    });

    it('종료일이 없는 프로모션은 시작 후 계속 활성 상태다', () => {
      // Given
      const promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      });
      const now = new Date('2030-01-01');

      // When & Then
      expect(promotion.isActive(now)).toBe(true);
      expect(promotion.isExpired(now)).toBe(false);
    });
  });

  describe('프로모션 적용 계산 정책', () => {
    let promotion: Promotion;

    beforeEach(() => {
      // 10+1 프로모션
      promotion = Promotion.create({
        id: 'test-promotion-id',
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      });
    });

    it('유료 수량 미만은 프로모션이 적용되지 않는다', () => {
      // When & Then
      expect(promotion.calculateApplicableSets(9)).toBe(0);
      expect(promotion.calculateFreeQuantity(9)).toBe(0);
      expect(promotion.calculatePayableQuantity(9)).toBe(9);
    });

    it('유료 수량 정확히 만큼 구매하면 1세트 적용된다', () => {
      // When & Then
      expect(promotion.calculateApplicableSets(10)).toBe(1);
      expect(promotion.calculateFreeQuantity(10)).toBe(1);
      expect(promotion.calculatePayableQuantity(10)).toBe(9); // 10 - 1
    });

    it('유료 수량의 배수만큼 세트가 적용된다', () => {
      // When & Then
      expect(promotion.calculateApplicableSets(20)).toBe(2);
      expect(promotion.calculateFreeQuantity(20)).toBe(2);
      expect(promotion.calculatePayableQuantity(20)).toBe(18); // 20 - 2

      expect(promotion.calculateApplicableSets(30)).toBe(3);
      expect(promotion.calculateFreeQuantity(30)).toBe(3);
      expect(promotion.calculatePayableQuantity(30)).toBe(27); // 30 - 3
    });

    it('배수가 아닌 경우 내림으로 계산한다', () => {
      // When & Then
      expect(promotion.calculateApplicableSets(25)).toBe(2); // 25 / 10 = 2.5 -> 2
      expect(promotion.calculateFreeQuantity(25)).toBe(2);
      expect(promotion.calculatePayableQuantity(25)).toBe(23); // 25 - 2
    });

    it('다양한 프로모션 비율 (5+2)에서도 계산이 정확하다', () => {
      // Given
      const promotion2 = Promotion.create({
        id: 'test-promotion-id-2',
        productId: 'test-product-id',
        paidQuantity: 5,
        freeQuantity: 2,
        startAt: new Date('2025-01-01'),
      });

      // When & Then
      expect(promotion2.calculateApplicableSets(5)).toBe(1);
      expect(promotion2.calculateFreeQuantity(5)).toBe(2);
      expect(promotion2.calculatePayableQuantity(5)).toBe(3); // 5 - 2

      expect(promotion2.calculateApplicableSets(10)).toBe(2);
      expect(promotion2.calculateFreeQuantity(10)).toBe(4);
      expect(promotion2.calculatePayableQuantity(10)).toBe(6); // 10 - 4

      expect(promotion2.calculateApplicableSets(12)).toBe(2);
      expect(promotion2.calculateFreeQuantity(12)).toBe(4);
      expect(promotion2.calculatePayableQuantity(12)).toBe(8); // 12 - 4
    });

    it('0개 구매 시 프로모션이 적용되지 않는다', () => {
      // When & Then
      expect(promotion.calculateApplicableSets(0)).toBe(0);
      expect(promotion.calculateFreeQuantity(0)).toBe(0);
      expect(promotion.calculatePayableQuantity(0)).toBe(0);
    });
  });
});
