import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import {
  IPromotionRepository,
  PROMOTION_REPOSITORY,
} from '../interface/promotion.repository.interface';
import { Promotion } from '../entity/promotion.entity';

describe('PromotionService', () => {
  let service: PromotionService;
  let mockRepository: jest.Mocked<IPromotionRepository>;

  beforeEach(async () => {
    // Mock Repository 생성
    mockRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      deleteByProductId: jest.fn(),
      findActiveByProductId: jest.fn(),
      findByProductId: jest.fn(),
      existsByProductIdAndPaidQuantity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionService,
        {
          provide: PROMOTION_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PromotionService>(PromotionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('프로모션을 생성할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const dto = [
        {
          paidQuantity: 10,
          freeQuantity: 1,
          startAt: new Date('2025-01-01'),
          endAt: new Date('2025-12-31'),
        },
      ];

      const createdPromotions = [
        Promotion.create({
          id: 'promotion-id-1',
          productId,
          ...dto[0],
        }),
      ];

      mockRepository.existsByProductIdAndPaidQuantity.mockResolvedValue(false);
      mockRepository.createMany.mockResolvedValue(createdPromotions);

      // When
      const result = await service.create(productId, dto);

      // Then
      expect(result).toHaveLength(1);
      expect(
        mockRepository.existsByProductIdAndPaidQuantity,
      ).toHaveBeenCalledWith(productId, dto[0].paidQuantity);
      expect(mockRepository.createMany).toHaveBeenCalledWith(
        productId,
        dto.map((item) => ({
          paidQuantity: item.paidQuantity,
          freeQuantity: item.freeQuantity,
          startAt: item.startAt,
          endAt: item.endAt,
        })),
      );
    });

    it('여러 개의 프로모션을 한 번에 생성할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const dto = [
        {
          paidQuantity: 10,
          freeQuantity: 1,
          startAt: new Date('2025-01-01'),
          endAt: new Date('2025-12-31'),
        },
        {
          paidQuantity: 20,
          freeQuantity: 3,
          startAt: new Date('2025-01-01'),
          endAt: new Date('2025-12-31'),
        },
      ];

      const createdPromotions = dto.map((item, index) =>
        Promotion.create({
          id: `promotion-id-${index + 1}`,
          productId,
          ...item,
        }),
      );

      mockRepository.existsByProductIdAndPaidQuantity.mockResolvedValue(false);
      mockRepository.createMany.mockResolvedValue(createdPromotions);

      // When
      const result = await service.create(productId, dto);

      // Then
      expect(result).toHaveLength(2);
      expect(
        mockRepository.existsByProductIdAndPaidQuantity,
      ).toHaveBeenCalledTimes(2);
    });

    it('startAt이 없으면 현재 시간으로 설정된다', async () => {
      // Given
      const productId = 'test-product-id';
      const dto = [
        {
          paidQuantity: 10,
          freeQuantity: 1,
        },
      ];

      const createdPromotions = [
        Promotion.create({
          id: 'promotion-id-1',
          productId,
          paidQuantity: 10,
          freeQuantity: 1,
          startAt: new Date(),
        }),
      ];

      mockRepository.existsByProductIdAndPaidQuantity.mockResolvedValue(false);
      mockRepository.createMany.mockResolvedValue(createdPromotions);

      // When
      await service.create(productId, dto);

      // Then
      const callArgs = mockRepository.createMany.mock.calls[0][1];
      expect(callArgs[0].startAt).toBeInstanceOf(Date);
      expect(callArgs[0].endAt).toBeNull();
    });

    it('BR-010: 같은 paidQuantity의 프로모션이 이미 존재하면 예외를 발생시킨다', async () => {
      // Given
      const productId = 'test-product-id';
      const dto = [
        {
          paidQuantity: 10,
          freeQuantity: 1,
          startAt: new Date('2025-01-01'),
        },
      ];

      mockRepository.existsByProductIdAndPaidQuantity.mockResolvedValue(true);

      // When & Then
      await expect(service.create(productId, dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(productId, dto)).rejects.toThrow(
        `이미 동일한 수량(${dto[0].paidQuantity})의 프로모션이 존재합니다.`,
      );

      expect(mockRepository.createMany).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('프로모션을 삭제할 수 있다', async () => {
      // Given
      const promotionId = 'test-promotion-id';
      const promotion = Promotion.create({
        id: promotionId,
        productId: 'test-product-id',
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
      });

      mockRepository.findById.mockResolvedValue(promotion);
      mockRepository.delete.mockResolvedValue(undefined);

      // When
      await service.delete(promotionId);

      // Then
      expect(mockRepository.findById).toHaveBeenCalledWith(promotionId);
      expect(mockRepository.delete).toHaveBeenCalledWith(promotionId);
    });

    it('존재하지 않는 프로모션을 삭제하려고 하면 예외를 발생시킨다', async () => {
      // Given
      const promotionId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.delete(promotionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete(promotionId)).rejects.toThrow(
        `ID ${promotionId}인 프로모션을 찾을 수 없습니다.`,
      );

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getActivePromotion', () => {
    it('상품의 활성 프로모션을 조회할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const promotion = Promotion.create({
        id: 'promotion-id',
        productId,
        paidQuantity: 10,
        freeQuantity: 1,
        startAt: new Date('2025-01-01'),
        endAt: new Date('2025-12-31'),
      });

      mockRepository.findActiveByProductId.mockResolvedValue(promotion);

      // When
      const result = await service.getActivePromotion(productId);

      // Then
      expect(result).toBe(promotion);
      expect(mockRepository.findActiveByProductId).toHaveBeenCalledWith(
        productId,
      );
    });

    it('활성 프로모션이 없으면 null을 반환한다', async () => {
      // Given
      const productId = 'test-product-id';
      mockRepository.findActiveByProductId.mockResolvedValue(null);

      // When
      const result = await service.getActivePromotion(productId);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getPromotionsByProductId', () => {
    it('상품의 모든 프로모션을 조회할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const promotions = [
        Promotion.create({
          id: 'promotion-id-1',
          productId,
          paidQuantity: 10,
          freeQuantity: 1,
          startAt: new Date('2025-01-01'),
        }),
        Promotion.create({
          id: 'promotion-id-2',
          productId,
          paidQuantity: 20,
          freeQuantity: 3,
          startAt: new Date('2025-01-01'),
        }),
      ];

      mockRepository.findByProductId.mockResolvedValue(promotions);

      // When
      const result = await service.getPromotionsByProductId(productId);

      // Then
      expect(result).toHaveLength(2);
      expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
    });

    it('프로모션이 없으면 빈 배열을 반환한다', async () => {
      // Given
      const productId = 'test-product-id';
      mockRepository.findByProductId.mockResolvedValue([]);

      // When
      const result = await service.getPromotionsByProductId(productId);

      // Then
      expect(result).toHaveLength(0);
    });
  });
});
