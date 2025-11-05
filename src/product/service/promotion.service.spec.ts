import { Test, TestingModule } from '@nestjs/testing';
import { PromotionService } from './promotion.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreatePromotionsDto } from '../dto/create-promotion.dto';

describe('PromotionService', () => {
  let service: PromotionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    productPromotion: {
      createMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PromotionService>(PromotionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('프로모션을 생성해야 한다', async () => {
      // given
      const productId = 'product-id-1';
      const dto: CreatePromotionsDto = [
        {
          wholesaleTier: 10,
          discountedPrice: 9000,
        },
        {
          wholesaleTier: 20,
          discountedPrice: 8500,
        },
      ];

      const expectedData = dto.map((promotion) => ({
        productId,
        ...promotion,
      }));

      mockPrismaService.productPromotion.createMany.mockResolvedValue({
        count: 2,
      });

      // when
      const result = await service.create(productId, dto);

      // then
      expect(mockPrismaService.productPromotion.createMany).toHaveBeenCalledWith(
        {
          data: expectedData,
        },
      );
      expect(result).toEqual({ count: 2 });
    });

    it('빈 배열로도 프로모션을 생성할 수 있어야 한다', async () => {
      // given
      const productId = 'product-id-1';
      const dto: CreatePromotionsDto = [];

      mockPrismaService.productPromotion.createMany.mockResolvedValue({
        count: 0,
      });

      // when
      const result = await service.create(productId, dto);

      // then
      expect(mockPrismaService.productPromotion.createMany).toHaveBeenCalledWith(
        {
          data: [],
        },
      );
      expect(result).toEqual({ count: 0 });
    });

    it('단일 프로모션도 생성할 수 있어야 한다', async () => {
      // given
      const productId = 'product-id-1';
      const dto: CreatePromotionsDto = [
        {
          wholesaleTier: 10,
          discountedPrice: 9000,
        },
      ];

      const expectedData = [
        {
          productId,
          wholesaleTier: 10,
          discountedPrice: 9000,
        },
      ];

      mockPrismaService.productPromotion.createMany.mockResolvedValue({
        count: 1,
      });

      // when
      const result = await service.create(productId, dto);

      // then
      expect(mockPrismaService.productPromotion.createMany).toHaveBeenCalledWith(
        {
          data: expectedData,
        },
      );
      expect(result).toEqual({ count: 1 });
    });
  });

  describe('delete', () => {
    it('프로모션을 삭제해야 한다', async () => {
      // given
      const promotionId = 'promotion-id-1';
      const deletedPromotion = {
        id: promotionId,
        productId: 'product-id-1',
        wholesaleTier: 10,
        discountedPrice: 9000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.productPromotion.count.mockResolvedValue(1);
      mockPrismaService.productPromotion.delete.mockResolvedValue(
        deletedPromotion,
      );

      // when
      const result = await service.delete(promotionId);

      // then
      expect(mockPrismaService.productPromotion.count).toHaveBeenCalledWith({
        where: { id: promotionId },
      });
      expect(mockPrismaService.productPromotion.delete).toHaveBeenCalledWith({
        where: { id: promotionId },
      });
      expect(result).toEqual(deletedPromotion);
    });

    it('존재하지 않는 프로모션을 삭제하려고 하면 NotFoundException을 던져야 한다', async () => {
      // given
      const promotionId = 'non-existent-id';

      mockPrismaService.productPromotion.count.mockResolvedValue(0);

      // when & then
      await expect(service.delete(promotionId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete(promotionId)).rejects.toThrow(
        `ID ${promotionId}인 프로모션을 찾을 수 없습니다.`,
      );

      expect(mockPrismaService.productPromotion.count).toHaveBeenCalledWith({
        where: { id: promotionId },
      });
      expect(mockPrismaService.productPromotion.delete).not.toHaveBeenCalled();
    });

    it('count가 0을 반환하면 삭제를 시도하지 않아야 한다', async () => {
      // given
      const promotionId = 'non-existent-id';

      mockPrismaService.productPromotion.count.mockResolvedValue(0);

      // when & then
      await expect(service.delete(promotionId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockPrismaService.productPromotion.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.productPromotion.delete).not.toHaveBeenCalled();
    });
  });
});
