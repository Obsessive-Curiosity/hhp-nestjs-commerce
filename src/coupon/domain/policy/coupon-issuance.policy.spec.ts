import { Coupon } from '../entity/coupon.entity';
import { CouponType, CouponScope } from '@prisma/client';

describe('Coupon Issuance Policy', () => {
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
});
