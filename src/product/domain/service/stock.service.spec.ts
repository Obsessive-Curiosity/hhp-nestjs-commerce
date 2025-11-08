import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import {
  IStockRepository,
  STOCK_REPOSITORY,
} from '../interface/stock.repository.interface';
import { ProductStock } from '../entity/product-stock.entity';

describe('StockService', () => {
  let service: StockService;
  let mockRepository: jest.Mocked<IStockRepository>;

  beforeEach(async () => {
    // Mock Repository 생성
    mockRepository = {
      findByProductId: jest.fn(),
      getQuantity: jest.fn(),
      create: jest.fn(),
      increaseWithVersion: jest.fn(),
      decreaseWithVersion: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: STOCK_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStock', () => {
    it('상품 ID로 재고를 조회할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 100);

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When
      const result = await service.getStock(productId);

      // Then
      expect(result).toBe(stock);
      expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
    });

    it('재고가 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const productId = 'non-existent-product-id';
      mockRepository.findByProductId.mockResolvedValue(null);

      // When & Then
      await expect(service.getStock(productId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStock(productId)).rejects.toThrow(
        `상품 ID ${productId}의 재고를 찾을 수 없습니다.`,
      );
    });
  });

  describe('getStockQuantity', () => {
    it('상품의 재고 수량을 조회할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const quantity = 100;

      mockRepository.getQuantity.mockResolvedValue(quantity);

      // When
      const result = await service.getStockQuantity(productId);

      // Then
      expect(result).toBe(quantity);
      expect(mockRepository.getQuantity).toHaveBeenCalledWith(productId);
    });
  });

  describe('createStock', () => {
    it('초기 수량을 지정하여 재고를 생성할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const initialQuantity = 100;
      const stock = ProductStock.create(productId, initialQuantity);

      mockRepository.create.mockResolvedValue(stock);

      // When
      const result = await service.createStock(productId, initialQuantity);

      // Then
      expect(result.productId).toBe(productId);
      expect(result.quantity).toBe(initialQuantity);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('초기 수량을 지정하지 않으면 0으로 생성된다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 0);

      mockRepository.create.mockResolvedValue(stock);

      // When
      const result = await service.createStock(productId);

      // Then
      expect(result.productId).toBe(productId);
      expect(result.quantity).toBe(0);
      expect(mockRepository.create).toHaveBeenCalled();
    });
  });

  describe('increaseStock', () => {
    it('재고를 증가시킬 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 100);
      const increaseAmount = 50;

      mockRepository.findByProductId.mockResolvedValue(stock);
      mockRepository.increaseWithVersion.mockResolvedValue(undefined);

      // When
      await service.increaseStock(productId, increaseAmount);

      // Then
      expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
      expect(mockRepository.increaseWithVersion).toHaveBeenCalledWith(
        productId,
        increaseAmount,
        stock.version,
      );
    });

    it('0 이하의 수량으로 증가시킬 수 없다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 100);

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When & Then
      await expect(service.increaseStock(productId, 0)).rejects.toThrow(
        '증가할 수량은 0보다 커야 합니다.',
      );

      await expect(service.increaseStock(productId, -10)).rejects.toThrow(
        '증가할 수량은 0보다 커야 합니다.',
      );

      expect(mockRepository.increaseWithVersion).not.toHaveBeenCalled();
    });

    it('재고가 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const productId = 'non-existent-product-id';
      mockRepository.findByProductId.mockResolvedValue(null);

      // When & Then
      await expect(service.increaseStock(productId, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('decreaseStock', () => {
    it('재고를 감소시킬 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 100);
      const decreaseAmount = 30;

      mockRepository.findByProductId.mockResolvedValue(stock);
      mockRepository.decreaseWithVersion.mockResolvedValue(undefined);

      // When
      await service.decreaseStock(productId, decreaseAmount);

      // Then
      expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
      expect(mockRepository.decreaseWithVersion).toHaveBeenCalledWith(
        productId,
        decreaseAmount,
        stock.version,
      );
    });

    it('재고가 부족하면 예외를 발생시킨다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 50);
      const decreaseAmount = 100;

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When & Then
      await expect(
        service.decreaseStock(productId, decreaseAmount),
      ).rejects.toThrow(
        `재고가 부족합니다. 현재 재고: ${stock.quantity}, 요청 수량: ${decreaseAmount}`,
      );

      expect(mockRepository.decreaseWithVersion).not.toHaveBeenCalled();
    });

    it('재고가 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const productId = 'non-existent-product-id';
      mockRepository.findByProductId.mockResolvedValue(null);

      // When & Then
      await expect(service.decreaseStock(productId, 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hasStock', () => {
    it('요청 수량만큼 재고가 있으면 true를 반환한다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 100);

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When
      const result = await service.hasStock(productId, 50);

      // Then
      expect(result).toBe(true);
      expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
    });

    it('요청 수량보다 재고가 적으면 false를 반환한다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 50);

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When
      const result = await service.hasStock(productId, 100);

      // Then
      expect(result).toBe(false);
    });

    it('재고가 존재하지 않으면 false를 반환한다', async () => {
      // Given
      const productId = 'non-existent-product-id';
      mockRepository.findByProductId.mockResolvedValue(null);

      // When
      const result = await service.hasStock(productId, 10);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('isOutOfStock', () => {
    it('재고가 0이면 true를 반환한다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 0);

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When
      const result = await service.isOutOfStock(productId);

      // Then
      expect(result).toBe(true);
    });

    it('재고가 있으면 false를 반환한다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 100);

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When
      const result = await service.isOutOfStock(productId);

      // Then
      expect(result).toBe(false);
    });

    it('재고가 존재하지 않으면 true를 반환한다', async () => {
      // Given
      const productId = 'non-existent-product-id';
      mockRepository.findByProductId.mockResolvedValue(null);

      // When
      const result = await service.isOutOfStock(productId);

      // Then
      expect(result).toBe(true);
    });
  });

  describe('checkStock', () => {
    it('재고가 충분하면 true를 반환한다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 100);
      const quantity = 50;

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When
      const result = await service.checkStock(productId, quantity);

      // Then
      expect(result).toBe(true);
      expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
    });

    it('재고가 부족하면 BadRequestException을 발생시킨다', async () => {
      // Given
      const productId = 'test-product-id';
      const stock = ProductStock.create(productId, 50);
      const quantity = 100;

      mockRepository.findByProductId.mockResolvedValue(stock);

      // When & Then
      await expect(service.checkStock(productId, quantity)).rejects.toThrow(
        `재고가 부족합니다. (요청: ${quantity}, 재고: ${stock.quantity})`,
      );
      expect(mockRepository.findByProductId).toHaveBeenCalledWith(productId);
    });

    it('재고가 존재하지 않으면 NotFoundException을 발생시킨다', async () => {
      // Given
      const productId = 'non-existent-product-id';
      mockRepository.findByProductId.mockResolvedValue(null);

      // When & Then
      await expect(service.checkStock(productId, 10)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.checkStock(productId, 10)).rejects.toThrow(
        `상품 ID ${productId}의 재고를 찾을 수 없습니다.`,
      );
    });
  });
});
