import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserCouponService } from './user-coupon.service';
import {
  IUserCouponRepository,
  USER_COUPON_REPOSITORY,
} from '../interface/user-coupon.repository.interface';
import {
  ICouponRepository,
  COUPON_REPOSITORY,
} from '../interface/coupon.repository.interface';
import { UserCoupon } from '../entity/user-coupon.entity';
import { Coupon } from '../entity/coupon.entity';
import { CouponStatus, CouponType, CouponScope } from '@prisma/client';

describe('UserCouponService Integration Tests', () => {
  let service: UserCouponService;
  let mockUserCouponRepository: jest.Mocked<IUserCouponRepository>;
  let mockCouponRepository: jest.Mocked<ICouponRepository>;

  beforeEach(async () => {
    // Mock Repositories 생성
    mockUserCouponRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAvailableCouponsByUserId: jest.fn(),
      existsByUserIdAndCouponId: jest.fn(),
      findExpiredCoupons: jest.fn(),
      expireCoupons: jest.fn(),
    };

    mockCouponRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAvailableCoupons: jest.fn(),
      increaseIssuedQuantity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCouponService,
        {
          provide: USER_COUPON_REPOSITORY,
          useValue: mockUserCouponRepository,
        },
        {
          provide: COUPON_REPOSITORY,
          useValue: mockCouponRepository,
        },
      ],
    }).compile();

    service = module.get<UserCouponService>(UserCouponService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('issueCoupon - BR-039, BR-040 통합', () => {
    it('쿠폰을 발급할 수 있다 (중복 체크 + 만료일 계산)', async () => {
      // Given
      const userId = 'test-user-id';
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

      mockUserCouponRepository.existsByUserIdAndCouponId.mockResolvedValue(
        false,
      );

      const createdUserCoupon = UserCoupon.create({
        id: 'test-user-coupon-id',
        userId,
        couponId: coupon.id,
        expiredAt: coupon.calculateExpiredAt(),
      });

      mockUserCouponRepository.create.mockResolvedValue(createdUserCoupon);

      // When
      const result = await service.issueCoupon(userId, coupon);

      // Then
      expect(result.userId).toBe(userId);
      expect(result.couponId).toBe(coupon.id);
      expect(result.status).toBe(CouponStatus.ISSUED);
      expect(
        mockUserCouponRepository.existsByUserIdAndCouponId,
      ).toHaveBeenCalledWith(userId, coupon.id);
      expect(mockUserCouponRepository.create).toHaveBeenCalled();
    });

    it('이미 발급받은 쿠폰이면 에러가 발생한다 - BR-039', async () => {
      // Given
      const userId = 'test-user-id';
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

      mockUserCouponRepository.existsByUserIdAndCouponId.mockResolvedValue(
        true,
      );

      // When & Then
      await expect(service.issueCoupon(userId, coupon)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.issueCoupon(userId, coupon)).rejects.toThrow(
        '이미 발급받은 쿠폰입니다.',
      );
    });

    it('validityDays로 만료일이 계산된다 - BR-040', async () => {
      // Given
      const userId = 'test-user-id';
      const validityDays = 7;
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
        validityDays: validityDays,
        totalQuantity: 100,
        issuedQuantity: 0,
        createdAt: new Date(),
      });

      mockUserCouponRepository.existsByUserIdAndCouponId.mockResolvedValue(
        false,
      );

      const createdUserCoupon = UserCoupon.create({
        id: 'test-user-coupon-id',
        userId,
        couponId: coupon.id,
        expiredAt: coupon.calculateExpiredAt(),
      });

      mockUserCouponRepository.create.mockResolvedValue(createdUserCoupon);

      // When
      const result = await service.issueCoupon(userId, coupon);

      // Then
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + validityDays);

      const actualDate = result.expiredAt;
      expect(actualDate.getDate()).toBe(expectedDate.getDate());
    });

    it('endAt으로 만료일이 설정된다 - BR-040', async () => {
      // Given
      const userId = 'test-user-id';
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

      mockUserCouponRepository.existsByUserIdAndCouponId.mockResolvedValue(
        false,
      );

      const createdUserCoupon = UserCoupon.create({
        id: 'test-user-coupon-id',
        userId,
        couponId: coupon.id,
        expiredAt: coupon.calculateExpiredAt(),
      });

      mockUserCouponRepository.create.mockResolvedValue(createdUserCoupon);

      // When
      const result = await service.issueCoupon(userId, coupon);

      // Then
      expect(result.expiredAt).toEqual(endAt);
    });
  });

  describe('useCoupon - BR-047', () => {
    it('사용 가능한 쿠폰을 사용할 수 있다', async () => {
      // Given
      const userCouponId = 'test-user-coupon-id';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: userCouponId,
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      mockUserCouponRepository.findById.mockResolvedValue(userCoupon);
      mockUserCouponRepository.update.mockResolvedValue(userCoupon);

      // When
      const result = await service.useCoupon(userCouponId);

      // Then
      expect(result.status).toBe(CouponStatus.USED);
      expect(result.usedAt).not.toBeNull();
      expect(mockUserCouponRepository.update).toHaveBeenCalledWith(userCoupon);
    });

    it('존재하지 않는 쿠폰이면 에러가 발생한다', async () => {
      // Given
      const userCouponId = 'non-existent-id';
      mockUserCouponRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.useCoupon(userCouponId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.useCoupon(userCouponId)).rejects.toThrow(
        '쿠폰을 찾을 수 없습니다.',
      );
    });

    it('만료된 쿠폰은 사용할 수 없다', async () => {
      // Given
      const userCouponId = 'test-user-coupon-id';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const userCoupon = new UserCoupon({
        id: userCouponId,
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: yesterday,
        usedAt: null,
      });

      mockUserCouponRepository.findById.mockResolvedValue(userCoupon);

      // When & Then
      await expect(service.useCoupon(userCouponId)).rejects.toThrow(
        '사용할 수 없는 쿠폰입니다.',
      );
    });
  });

  describe('restoreCoupon - BR-054', () => {
    it('사용된 쿠폰을 복구할 수 있다', async () => {
      // Given
      const userCouponId = 'test-user-coupon-id';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: userCouponId,
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.USED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: new Date(),
      });

      mockUserCouponRepository.findById.mockResolvedValue(userCoupon);
      mockUserCouponRepository.update.mockResolvedValue(userCoupon);

      // When
      const result = await service.restoreCoupon(userCouponId);

      // Then
      expect(result.status).toBe(CouponStatus.ISSUED);
      expect(result.usedAt).toBeNull();
      expect(mockUserCouponRepository.update).toHaveBeenCalledWith(userCoupon);
    });

    it('존재하지 않는 쿠폰이면 에러가 발생한다', async () => {
      // Given
      const userCouponId = 'non-existent-id';
      mockUserCouponRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.restoreCoupon(userCouponId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.restoreCoupon(userCouponId)).rejects.toThrow(
        '쿠폰을 찾을 수 없습니다.',
      );
    });

    it('만료된 쿠폰은 복구할 수 없다', async () => {
      // Given
      const userCouponId = 'test-user-coupon-id';
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const userCoupon = new UserCoupon({
        id: userCouponId,
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.USED,
        createdAt: new Date(),
        expiredAt: yesterday,
        usedAt: new Date(),
      });

      mockUserCouponRepository.findById.mockResolvedValue(userCoupon);

      // When & Then
      await expect(service.restoreCoupon(userCouponId)).rejects.toThrow(
        '만료된 쿠폰은 복구할 수 없습니다.',
      );
    });

    it('사용되지 않은 쿠폰은 복구할 수 없다', async () => {
      // Given
      const userCouponId = 'test-user-coupon-id';
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const userCoupon = new UserCoupon({
        id: userCouponId,
        userId: 'test-user-id',
        couponId: 'test-coupon-id',
        status: CouponStatus.ISSUED,
        createdAt: new Date(),
        expiredAt: tomorrow,
        usedAt: null,
      });

      mockUserCouponRepository.findById.mockResolvedValue(userCoupon);

      // When & Then
      await expect(service.restoreCoupon(userCouponId)).rejects.toThrow(
        '사용된 쿠폰만 복구할 수 있습니다.',
      );
    });
  });

  describe('findUserCoupons', () => {
    it('사용자의 모든 쿠폰을 조회할 수 있다', async () => {
      // Given
      const userId = 'test-user-id';
      const userCoupons = [
        new UserCoupon({
          id: 'user-coupon-1',
          userId,
          couponId: 'coupon-1',
          status: CouponStatus.ISSUED,
          createdAt: new Date(),
          expiredAt: new Date('2024-12-31'),
          usedAt: null,
        }),
        new UserCoupon({
          id: 'user-coupon-2',
          userId,
          couponId: 'coupon-2',
          status: CouponStatus.USED,
          createdAt: new Date(),
          expiredAt: new Date('2024-12-31'),
          usedAt: new Date(),
        }),
      ];

      mockUserCouponRepository.findByUserId.mockResolvedValue(userCoupons);

      // When
      const result = await service.findUserCoupons(userId);

      // Then
      expect(result).toHaveLength(2);
      expect(mockUserCouponRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        {
          status: undefined,
          includeCoupon: true,
        },
      );
    });

    it('특정 상태의 쿠폰만 조회할 수 있다', async () => {
      // Given
      const userId = 'test-user-id';
      const status = CouponStatus.ISSUED;
      const userCoupons = [
        new UserCoupon({
          id: 'user-coupon-1',
          userId,
          couponId: 'coupon-1',
          status: CouponStatus.ISSUED,
          createdAt: new Date(),
          expiredAt: new Date('2024-12-31'),
          usedAt: null,
        }),
      ];

      mockUserCouponRepository.findByUserId.mockResolvedValue(userCoupons);

      // When
      const result = await service.findUserCoupons(userId, status);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(CouponStatus.ISSUED);
      expect(mockUserCouponRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        {
          status,
          includeCoupon: true,
        },
      );
    });
  });

  describe('expireExpiredCoupons', () => {
    it('만료된 쿠폰들을 일괄 처리할 수 있다', async () => {
      // Given
      const expiredCoupons = [
        new UserCoupon({
          id: 'user-coupon-1',
          userId: 'user-1',
          couponId: 'coupon-1',
          status: CouponStatus.ISSUED,
          createdAt: new Date(),
          expiredAt: new Date('2023-12-31'),
          usedAt: null,
        }),
        new UserCoupon({
          id: 'user-coupon-2',
          userId: 'user-2',
          couponId: 'coupon-2',
          status: CouponStatus.ISSUED,
          createdAt: new Date(),
          expiredAt: new Date('2023-12-31'),
          usedAt: null,
        }),
      ];

      mockUserCouponRepository.findExpiredCoupons.mockResolvedValue(
        expiredCoupons,
      );
      mockUserCouponRepository.expireCoupons.mockResolvedValue(undefined);

      // When
      await service.expireExpiredCoupons();

      // Then
      expect(mockUserCouponRepository.findExpiredCoupons).toHaveBeenCalled();
      expect(mockUserCouponRepository.expireCoupons).toHaveBeenCalledWith([
        'user-coupon-1',
        'user-coupon-2',
      ]);
    });

    it('만료된 쿠폰이 없으면 처리하지 않는다', async () => {
      // Given
      mockUserCouponRepository.findExpiredCoupons.mockResolvedValue([]);

      // When
      await service.expireExpiredCoupons();

      // Then
      expect(mockUserCouponRepository.findExpiredCoupons).toHaveBeenCalled();
      expect(mockUserCouponRepository.expireCoupons).not.toHaveBeenCalled();
    });
  });
});
