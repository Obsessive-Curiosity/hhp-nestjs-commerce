import { Coupon } from './coupon.entity';
import { CouponType, CouponScope } from '@prisma/client';

describe('Coupon Entity', () => {
  describe('create', () => {
    it('AMOUNT 타입 쿠폰을 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-coupon-id',
        name: '5000원 할인 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        totalQuantity: 100,
      };

      // When
      const coupon = Coupon.create(params);

      // Then
      expect(coupon.id).toBe(params.id);
      expect(coupon.name).toBe(params.name);
      expect(coupon.type).toBe(CouponType.AMOUNT);
      expect(coupon.discountAmount).toBe(5000);
      expect(coupon.totalQuantity).toBe(100);
      expect(coupon.issuedQuantity).toBe(0);
    });

    it('RATE 타입 쿠폰을 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-coupon-id',
        name: '10% 할인 쿠폰',
        type: CouponType.RATE,
        scope: CouponScope.ORDER,
        discountRate: 10,
        maxDiscountAmount: 10000,
        totalQuantity: 100,
      };

      // When
      const coupon = Coupon.create(params);

      // Then
      expect(coupon.type).toBe(CouponType.RATE);
      expect(coupon.discountRate).toBe(10);
      expect(coupon.maxDiscountAmount).toBe(10000);
    });

    it('무제한 쿠폰을 생성할 수 있다 (totalQuantity: null)', () => {
      // Given
      const params = {
        id: 'test-coupon-id',
        name: '무제한 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        totalQuantity: null,
      };

      // When
      const coupon = Coupon.create(params);

      // Then
      expect(coupon.totalQuantity).toBeNull();
    });

    it('AMOUNT 쿠폰 생성 시 할인 금액이 없으면 에러가 발생한다', () => {
      // Given
      const params = {
        id: 'test-coupon-id',
        name: '잘못된 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: null,
      };

      // When & Then
      expect(() => Coupon.create(params)).toThrow(
        '고정 금액 할인 쿠폰은 할인 금액이 필요합니다.',
      );
    });

    it('RATE 쿠폰 생성 시 할인율이 0 이하면 에러가 발생한다', () => {
      // Given
      const params = {
        id: 'test-coupon-id',
        name: '잘못된 쿠폰',
        type: CouponType.RATE,
        scope: CouponScope.ORDER,
        discountRate: 0,
      };

      // When & Then
      expect(() => Coupon.create(params)).toThrow(
        '비율 할인 쿠폰은 1~100 사이의 할인율이 필요합니다.',
      );
    });

    it('RATE 쿠폰 생성 시 할인율이 100을 초과하면 에러가 발생한다', () => {
      // Given
      const params = {
        id: 'test-coupon-id',
        name: '잘못된 쿠폰',
        type: CouponType.RATE,
        scope: CouponScope.ORDER,
        discountRate: 101,
      };

      // When & Then
      expect(() => Coupon.create(params)).toThrow(
        '비율 할인 쿠폰은 1~100 사이의 할인율이 필요합니다.',
      );
    });
  });

  describe('canIssue - BR-038', () => {
    it('발급 시작일이 현재보다 미래면 발급할 수 없다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: tomorrow,
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const result = coupon.canIssue();

      // Then
      expect(result).toBe(false);
    });

    it('발급 종료일이 현재보다 과거면 발급할 수 없다', () => {
      // Given
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: yesterday,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const result = coupon.canIssue();

      // Then
      expect(result).toBe(false);
    });

    it('발급 수량이 전체 수량에 도달하면 발급할 수 없다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 100,
        createdAt: new Date(),
      });

      // When
      const result = coupon.canIssue();

      // Then
      expect(result).toBe(false);
    });

    it('무제한 쿠폰(totalQuantity: null)은 항상 발급할 수 있다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: null,
        issuedQuantity: 999999,
        createdAt: new Date(),
      });

      // When
      const result = coupon.canIssue();

      // Then
      expect(result).toBe(true);
    });

    it('모든 조건을 만족하면 발급할 수 있다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 50,
        createdAt: new Date(),
      });

      // When
      const result = coupon.canIssue();

      // Then
      expect(result).toBe(true);
    });
  });

  describe('increaseIssuedQuantity - BR-038', () => {
    it('발급 수량을 증가시킬 수 있다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 50,
        createdAt: new Date(),
      });

      // When
      coupon.increaseIssuedQuantity();

      // Then
      expect(coupon.issuedQuantity).toBe(51);
    });

    it('발급 가능 수량을 초과하면 에러가 발생한다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 100,
        createdAt: new Date(),
      });

      // When & Then
      expect(() => coupon.increaseIssuedQuantity()).toThrow(
        '쿠폰 발급 가능 수량을 초과했습니다.',
      );
    });

    it('무제한 쿠폰(totalQuantity: null)은 수량 제한 없이 증가할 수 있다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: null,
        issuedQuantity: 999999,
        createdAt: new Date(),
      });

      // When
      coupon.increaseIssuedQuantity();

      // Then
      expect(coupon.issuedQuantity).toBe(1000000);
    });
  });

  describe('calculateExpiredAt - BR-040', () => {
    it('validityDays가 있으면 현재 시간 기준으로 만료일을 계산한다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: 7,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const expiredAt = coupon.calculateExpiredAt();

      // Then
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      expect(expiredAt.getDate()).toBe(expectedDate.getDate());
    });

    it('validityDays가 null이고 endAt이 있으면 endAt을 반환한다', () => {
      // Given
      const endAt = new Date('2024-12-31');
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: endAt,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const expiredAt = coupon.calculateExpiredAt();

      // Then
      expect(expiredAt).toBe(endAt);
    });

    it('validityDays와 endAt이 모두 null이면 에러가 발생한다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When & Then
      expect(() => coupon.calculateExpiredAt()).toThrow(
        '쿠폰의 유효 기간 정책이 설정되지 않았습니다.',
      );
    });
  });

  describe('checkMinPurchaseAmount - BR-046', () => {
    it('최소 구매 금액이 설정되지 않으면 항상 true를 반환한다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: null,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const result = coupon.checkMinPurchaseAmount(1000);

      // Then
      expect(result).toBe(true);
    });

    it('구매 금액이 최소 구매 금액보다 크거나 같으면 true를 반환한다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: 50000,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const result = coupon.checkMinPurchaseAmount(50000);

      // Then
      expect(result).toBe(true);
    });

    it('구매 금액이 최소 구매 금액보다 작으면 false를 반환한다', () => {
      // Given
      const coupon = new Coupon({
        id: 'test-coupon-id',
        name: '테스트 쿠폰',
        type: CouponType.AMOUNT,
        scope: CouponScope.ORDER,
        discountAmount: 5000,
        discountRate: null,
        maxDiscountAmount: null,
        minPurchaseAmount: 50000,
        startAt: new Date('2024-01-01'),
        endAt: null,
        validityDays: null,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const result = coupon.checkMinPurchaseAmount(49999);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('calculateDiscount - BR-033, BR-034', () => {
    describe('AMOUNT 타입', () => {
      it('할인 금액을 반환한다', () => {
        // Given
        const coupon = new Coupon({
          id: 'test-coupon-id',
          name: '테스트 쿠폰',
          type: CouponType.AMOUNT,
          scope: CouponScope.ORDER,
          discountAmount: 5000,
          discountRate: null,
          maxDiscountAmount: null,
          minPurchaseAmount: null,
          startAt: new Date('2024-01-01'),
          endAt: null,
          validityDays: null,
          totalQuantity: 100,
          issuedQuantity: 0,
          createdAt: new Date(),
        });

        // When
        const discount = coupon.calculateDiscount(100000);

        // Then
        expect(discount).toBe(5000);
      });

      it('대상 금액보다 할인 금액이 크면 대상 금액만큼만 할인한다', () => {
        // Given
        const coupon = new Coupon({
          id: 'test-coupon-id',
          name: '테스트 쿠폰',
          type: CouponType.AMOUNT,
          scope: CouponScope.ORDER,
          discountAmount: 5000,
          discountRate: null,
          maxDiscountAmount: null,
          minPurchaseAmount: null,
          startAt: new Date('2024-01-01'),
          endAt: null,
          validityDays: null,
          totalQuantity: 100,
          issuedQuantity: 0,
          createdAt: new Date(),
        });

        // When
        const discount = coupon.calculateDiscount(3000);

        // Then
        expect(discount).toBe(3000);
      });
    });

    describe('RATE 타입', () => {
      it('할인율에 따라 할인 금액을 계산한다', () => {
        // Given
        const coupon = new Coupon({
          id: 'test-coupon-id',
          name: '테스트 쿠폰',
          type: CouponType.RATE,
          scope: CouponScope.ORDER,
          discountAmount: null,
          discountRate: 10,
          maxDiscountAmount: null,
          minPurchaseAmount: null,
          startAt: new Date('2024-01-01'),
          endAt: null,
          validityDays: null,
          totalQuantity: 100,
          issuedQuantity: 0,
          createdAt: new Date(),
        });

        // When
        const discount = coupon.calculateDiscount(100000);

        // Then
        expect(discount).toBe(10000);
      });

      it('할인 금액을 내림 처리한다', () => {
        // Given
        const coupon = new Coupon({
          id: 'test-coupon-id',
          name: '테스트 쿠폰',
          type: CouponType.RATE,
          scope: CouponScope.ORDER,
          discountAmount: null,
          discountRate: 10,
          maxDiscountAmount: null,
          minPurchaseAmount: null,
          startAt: new Date('2024-01-01'),
          endAt: null,
          validityDays: null,
          totalQuantity: 100,
          issuedQuantity: 0,
          createdAt: new Date(),
        });

        // When
        const discount = coupon.calculateDiscount(12345);

        // Then
        expect(discount).toBe(1234); // 1234.5 -> 1234
      });

      it('최대 할인 금액이 설정되어 있으면 그 이상 할인하지 않는다', () => {
        // Given
        const coupon = new Coupon({
          id: 'test-coupon-id',
          name: '테스트 쿠폰',
          type: CouponType.RATE,
          scope: CouponScope.ORDER,
          discountAmount: null,
          discountRate: 20,
          maxDiscountAmount: 10000,
          minPurchaseAmount: null,
          startAt: new Date('2024-01-01'),
          endAt: null,
          validityDays: null,
          totalQuantity: 100,
          issuedQuantity: 0,
          createdAt: new Date(),
        });

        // When
        const discount = coupon.calculateDiscount(100000);

        // Then
        expect(discount).toBe(10000); // 20000 -> 10000 (최대 할인)
      });

      it('최대 할인 금액보다 계산된 할인이 작으면 계산된 금액을 반환한다', () => {
        // Given
        const coupon = new Coupon({
          id: 'test-coupon-id',
          name: '테스트 쿠폰',
          type: CouponType.RATE,
          scope: CouponScope.ORDER,
          discountAmount: null,
          discountRate: 10,
          maxDiscountAmount: 10000,
          minPurchaseAmount: null,
          startAt: new Date('2024-01-01'),
          endAt: null,
          validityDays: null,
          totalQuantity: 100,
          issuedQuantity: 0,
          createdAt: new Date(),
        });

        // When
        const discount = coupon.calculateDiscount(50000);

        // Then
        expect(discount).toBe(5000);
      });
    });
  });
});
