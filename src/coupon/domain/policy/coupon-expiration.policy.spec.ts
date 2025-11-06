import { Coupon } from '../entity/coupon.entity';
import { CouponType, CouponScope } from '@prisma/client';

describe('Coupon Expiration Policy', () => {
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

    it('validityDays가 우선순위를 갖는다 (validityDays와 endAt 모두 있을 때)', () => {
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
        validityDays: 30, // validityDays가 있으면 이게 우선
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      // When
      const expiredAt = coupon.calculateExpiredAt();

      // Then
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);
      expect(expiredAt.getDate()).toBe(expectedDate.getDate());
      expect(expiredAt).not.toBe(endAt); // endAt이 아님
    });
  });
});
