import { Coupon } from '../entity/coupon.entity';
import { CouponType, CouponScope } from '@prisma/client';

describe('Coupon Validation Policy', () => {
  describe('validateCouponType', () => {
    describe('AMOUNT 타입 검증', () => {
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

      it('AMOUNT 쿠폰 생성 시 할인 금액이 0 이하면 에러가 발생한다', () => {
        // Given
        const params = {
          id: 'test-coupon-id',
          name: '잘못된 쿠폰',
          type: CouponType.AMOUNT,
          scope: CouponScope.ORDER,
          discountAmount: 0,
        };

        // When & Then
        expect(() => Coupon.create(params)).toThrow(
          '고정 금액 할인 쿠폰은 할인 금액이 필요합니다.',
        );
      });

      it('AMOUNT 쿠폰 생성 시 할인 금액이 음수면 에러가 발생한다', () => {
        // Given
        const params = {
          id: 'test-coupon-id',
          name: '잘못된 쿠폰',
          type: CouponType.AMOUNT,
          scope: CouponScope.ORDER,
          discountAmount: -1000,
        };

        // When & Then
        expect(() => Coupon.create(params)).toThrow(
          '고정 금액 할인 쿠폰은 할인 금액이 필요합니다.',
        );
      });

      it('AMOUNT 쿠폰 생성 시 할인 금액이 양수면 생성할 수 있다', () => {
        // Given
        const params = {
          id: 'test-coupon-id',
          name: '5000원 할인 쿠폰',
          type: CouponType.AMOUNT,
          scope: CouponScope.ORDER,
          discountAmount: 5000,
          totalQuantity: 100,
        };

        // When & Then
        expect(() => Coupon.create(params)).not.toThrow();
      });
    });

    describe('RATE 타입 검증', () => {
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

      it('RATE 쿠폰 생성 시 할인율이 음수면 에러가 발생한다', () => {
        // Given
        const params = {
          id: 'test-coupon-id',
          name: '잘못된 쿠폰',
          type: CouponType.RATE,
          scope: CouponScope.ORDER,
          discountRate: -10,
        };

        // When & Then
        expect(() => Coupon.create(params)).toThrow(
          '비율 할인 쿠폰은 1~100 사이의 할인율이 필요합니다.',
        );
      });

      it('RATE 쿠폰 생성 시 할인율이 1이면 생성할 수 있다', () => {
        // Given
        const params = {
          id: 'test-coupon-id',
          name: '1% 할인 쿠폰',
          type: CouponType.RATE,
          scope: CouponScope.ORDER,
          discountRate: 1,
          totalQuantity: 100,
        };

        // When & Then
        expect(() => Coupon.create(params)).not.toThrow();
      });

      it('RATE 쿠폰 생성 시 할인율이 100이면 생성할 수 있다', () => {
        // Given
        const params = {
          id: 'test-coupon-id',
          name: '100% 할인 쿠폰',
          type: CouponType.RATE,
          scope: CouponScope.ORDER,
          discountRate: 100,
          totalQuantity: 100,
        };

        // When & Then
        expect(() => Coupon.create(params)).not.toThrow();
      });

      it('RATE 쿠폰 생성 시 할인율이 1~100 사이면 생성할 수 있다', () => {
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

        // When & Then
        expect(() => Coupon.create(params)).not.toThrow();
      });
    });
  });
});
