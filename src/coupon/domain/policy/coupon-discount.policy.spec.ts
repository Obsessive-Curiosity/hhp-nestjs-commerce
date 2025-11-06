import { Coupon } from '../entity/coupon.entity';
import { CouponType, CouponScope } from '@prisma/client';

describe('Coupon Discount Policy', () => {
  describe('calculateDiscount - BR-033, BR-034', () => {
    describe('AMOUNT 타입 - BR-033', () => {
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

    describe('RATE 타입 - BR-034', () => {
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
});
