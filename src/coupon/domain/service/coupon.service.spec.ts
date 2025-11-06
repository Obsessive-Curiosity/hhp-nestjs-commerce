import { Test, TestingModule } from '@nestjs/testing';
import { CouponService } from './coupon.service';
import {
  ICouponRepository,
  COUPON_REPOSITORY,
} from '../interface/coupon.repository.interface';
import { Coupon } from '../entity/coupon.entity';
import { CouponType, CouponScope } from '@prisma/client';

describe('CouponService', () => {
  let service: CouponService;
  let mockRepository: jest.Mocked<ICouponRepository>;

  beforeEach(async () => {
    // Mock Repository 생성
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAvailableCoupons: jest.fn(),
      increaseIssuedQuantity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        {
          provide: COUPON_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCoupon', () => {
    it('AMOUNT 타입 쿠폰을 생성할 수 있다', async () => {
      // Given
      const dto = {
        name: '5000원 할인 쿠폰',
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
      };

      const createdCoupon = Coupon.create({
        id: 'test-coupon-id',
        ...dto,
      });

      mockRepository.create.mockResolvedValue(createdCoupon);

      // When
      const result = await service.createCoupon(dto);

      // Then
      expect(result.name).toBe(dto.name);
      expect(result.type).toBe(CouponType.AMOUNT);
      expect(result.discountAmount).toBe(5000);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: dto.name,
          type: dto.type,
          discountAmount: dto.discountAmount,
        }),
      );
    });

    it('RATE 타입 쿠폰을 생성할 수 있다', async () => {
      // Given
      const dto = {
        name: '10% 할인 쿠폰',
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
      };

      const createdCoupon = Coupon.create({
        id: 'test-coupon-id',
        ...dto,
      });

      mockRepository.create.mockResolvedValue(createdCoupon);

      // When
      const result = await service.createCoupon(dto);

      // Then
      expect(result.type).toBe(CouponType.RATE);
      expect(result.discountRate).toBe(10);
      expect(result.maxDiscountAmount).toBe(10000);
    });

    it('무제한 쿠폰을 생성할 수 있다', async () => {
      // Given
      const dto = {
        name: '무제한 쿠폰',
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
      };

      const createdCoupon = Coupon.create({
        id: 'test-coupon-id',
        ...dto,
      });

      mockRepository.create.mockResolvedValue(createdCoupon);

      // When
      const result = await service.createCoupon(dto);

      // Then
      expect(result.totalQuantity).toBeNull();
    });
  });

  describe('findCouponById', () => {
    it('ID로 쿠폰을 조회할 수 있다', async () => {
      // Given
      const couponId = 'test-coupon-id';
      const coupon = new Coupon({
        id: couponId,
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

      mockRepository.findById.mockResolvedValue(coupon);

      // When
      const result = await service.findCouponById(couponId);

      // Then
      expect(result).toBe(coupon);
      expect(mockRepository.findById).toHaveBeenCalledWith(couponId, {
        includeCategories: true,
        includeProducts: true,
      });
    });

    it('존재하지 않는 쿠폰 ID면 null을 반환한다', async () => {
      // Given
      const couponId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await service.findCouponById(couponId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('findAllCoupons', () => {
    it('모든 쿠폰을 조회할 수 있다', async () => {
      // Given
      const coupons = [
        new Coupon({
          id: 'coupon-1',
          name: '쿠폰 1',
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
        }),
        new Coupon({
          id: 'coupon-2',
          name: '쿠폰 2',
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
        }),
      ];

      mockRepository.findAll.mockResolvedValue(coupons);

      // When
      const result = await service.findAllCoupons();

      // Then
      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith({
        includeCategories: true,
        includeProducts: true,
      });
    });
  });

  describe('findAvailableCoupons', () => {
    it('발급 가능한 쿠폰을 조회할 수 있다', async () => {
      // Given
      const coupons = [
        new Coupon({
          id: 'coupon-1',
          name: '쿠폰 1',
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
        }),
      ];

      mockRepository.findAvailableCoupons.mockResolvedValue(coupons);

      // When
      const result = await service.findAvailableCoupons();

      // Then
      expect(result).toHaveLength(1);
      expect(mockRepository.findAvailableCoupons).toHaveBeenCalled();
    });
  });

  describe('checkCanIssue - BR-038', () => {
    it('발급 가능한 쿠폰이면 true를 반환한다', async () => {
      // Given
      const couponId = 'test-coupon-id';
      const coupon = new Coupon({
        id: couponId,
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

      mockRepository.findById.mockResolvedValue(coupon);

      // When
      const result = await service.checkCanIssue(couponId);

      // Then
      expect(result).toBe(true);
    });

    it('쿠폰이 존재하지 않으면 false를 반환한다', async () => {
      // Given
      const couponId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await service.checkCanIssue(couponId);

      // Then
      expect(result).toBe(false);
    });

    it('발급 가능하지 않은 쿠폰이면 false를 반환한다', async () => {
      // Given
      const couponId = 'test-coupon-id';
      const coupon = new Coupon({
        id: couponId,
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
        issuedQuantity: 100, // 수량 소진
        createdAt: new Date(),
      });

      mockRepository.findById.mockResolvedValue(coupon);

      // When
      const result = await service.checkCanIssue(couponId);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('increaseIssuedQuantity - BR-038', () => {
    it('쿠폰 발급 수량을 증가시킬 수 있다', async () => {
      // Given
      const couponId = 'test-coupon-id';
      mockRepository.increaseIssuedQuantity.mockResolvedValue(undefined);

      // When
      await service.increaseIssuedQuantity(couponId);

      // Then
      expect(mockRepository.increaseIssuedQuantity).toHaveBeenCalledWith(
        couponId,
      );
    });
  });
});
