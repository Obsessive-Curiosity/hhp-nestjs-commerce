import { UserCoupon } from './user-coupon.entity';
import { CouponStatus } from '@prisma/client';

describe('UserCoupon Entity', () => {
  describe('create', () => {
    it('신규 UserCoupon을 생성할 수 있다', () => {
      // Given
      const expiredAt = new Date('2024-12-31');
      const params = {
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        expiredAt,
      };

      // When
      const userCoupon = UserCoupon.create(params);

      // Then
      expect(userCoupon.id).toBe(params.id);
      expect(userCoupon.userId).toBe(params.userId);
      expect(userCoupon.couponId).toBe(params.couponId);
      expect(userCoupon.status).toBe(CouponStatus.ISSUED);
      expect(userCoupon.expiredAt).toBe(expiredAt);
      expect(userCoupon.usedAt).toBeNull();
    });
  });

  describe('isExpired - BR-045', () => {
    it('상태가 EXPIRED면 만료된 것으로 판단한다', () => {
      // Given
      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.EXPIRED,
        createdAt: new Date(),
        expiredAt: new Date('2024-12-31'),
        usedAt: null,
      });

      // When
      const result = userCoupon.isExpired();

      // Then
      expect(result).toBe(true);
    });

    it('현재 시간이 만료일을 지나면 만료된 것으로 판단한다', () => {
      // Given
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: yesterday,
        usedAt: null,
      });

      // When
      const result = userCoupon.isExpired();

      // Then
      expect(result).toBe(true);
    });

    it('현재 시간이 만료일 이전이면 만료되지 않은 것으로 판단한다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      // When
      const result = userCoupon.isExpired();

      // Then
      expect(result).toBe(false);
    });
  });

  describe('canUse - BR-047', () => {
    it('상태가 ISSUED이고 만료되지 않았으면 사용 가능하다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      // When
      const result = userCoupon.canUse();

      // Then
      expect(result).toBe(true);
    });

    it('상태가 USED면 사용할 수 없다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.USED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: new Date(),
      });

      // When
      const result = userCoupon.canUse();

      // Then
      expect(result).toBe(false);
    });

    it('상태가 EXPIRED면 사용할 수 없다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.EXPIRED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      // When
      const result = userCoupon.canUse();

      // Then
      expect(result).toBe(false);
    });

    it('만료일이 지났으면 사용할 수 없다', () => {
      // Given
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: yesterday,
        usedAt: null,
      });

      // When
      const result = userCoupon.canUse();

      // Then
      expect(result).toBe(false);
    });
  });

  describe('use - BR-047', () => {
    it('사용 가능한 쿠폰을 사용 처리할 수 있다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      // When
      userCoupon.use();

      // Then
      expect(userCoupon.status).toBe(CouponStatus.USED);
      expect(userCoupon.usedAt).not.toBeNull();
      expect(userCoupon.getDirtyFields().has('status')).toBe(true);
      expect(userCoupon.getDirtyFields().has('usedAt')).toBe(true);
    });

    it('이미 사용된 쿠폰은 사용할 수 없다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.USED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: new Date(),
      });

      // When & Then
      expect(() => userCoupon.use()).toThrow('사용할 수 없는 쿠폰입니다.');
    });

    it('만료된 쿠폰은 사용할 수 없다', () => {
      // Given
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: yesterday,
        usedAt: null,
      });

      // When & Then
      expect(() => userCoupon.use()).toThrow('사용할 수 없는 쿠폰입니다.');
    });
  });

  describe('restore - BR-054', () => {
    it('사용된 쿠폰을 복구할 수 있다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.USED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: new Date(),
      });

      // When
      userCoupon.restore();

      // Then
      expect(userCoupon.status).toBe(CouponStatus.ISSUED);
      expect(userCoupon.usedAt).toBeNull();
      expect(userCoupon.getDirtyFields().has('status')).toBe(true);
      expect(userCoupon.getDirtyFields().has('usedAt')).toBe(true);
    });

    it('사용되지 않은 쿠폰은 복구할 수 없다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      // When & Then
      expect(() => userCoupon.restore()).toThrow(
        '사용된 쿠폰만 복구할 수 있습니다.',
      );
    });

    it('만료된 쿠폰은 복구할 수 없다', () => {
      // Given
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.USED,
        createdAt: new Date(),
        expiredAt: yesterday,
        usedAt: new Date(),
      });

      // When & Then
      expect(() => userCoupon.restore()).toThrow(
        '만료된 쿠폰은 복구할 수 없습니다.',
      );
    });
  });

  describe('expire', () => {
    it('발급된 쿠폰을 만료 처리할 수 있다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      // When
      userCoupon.expire();

      // Then
      expect(userCoupon.status).toBe(CouponStatus.EXPIRED);
      expect(userCoupon.getDirtyFields().has('status')).toBe(true);
    });

    it('이미 사용된 쿠폰은 만료 처리할 수 없다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.USED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: new Date(),
      });

      // When & Then
      expect(() => userCoupon.expire()).toThrow(
        '발급된 쿠폰만 만료 처리할 수 있습니다.',
      );
    });
  });

  describe('더티 체킹', () => {
    it('use() 호출 시 더티 필드가 기록된다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      // When
      userCoupon.use();

      // Then
      const dirtyFields = userCoupon.getDirtyFields();
      expect(dirtyFields.size).toBe(2);
      expect(dirtyFields.has('status')).toBe(true);
      expect(dirtyFields.has('usedAt')).toBe(true);
    });

    it('clearDirtyFields() 호출 시 더티 필드가 초기화된다', () => {
      // Given
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: 'test-user-coupon-id',
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      userCoupon.use();

      // When
      userCoupon.clearDirtyFields();

      // Then
      expect(userCoupon.getDirtyFields().size).toBe(0);
    });
  });
});
