import { Test, TestingModule } from '@nestjs/testing';
import { PointService } from './point.service';
import {
  IPointRepository,
  POINT_REPOSITORY,
} from '../interface/point.repository.interface';
import {
  IPointHistoryRepository,
  POINT_HISTORY_REPOSITORY,
} from '../interface/point-history.repository.interface';
import { Point } from '../entity/point.entity';
import { PointHistory, PointHistoryType } from '../entity/point-history.entity';

describe('PointService', () => {
  let service: PointService;
  let mockPointRepository: jest.Mocked<IPointRepository>;
  let mockHistoryRepository: jest.Mocked<IPointHistoryRepository>;

  beforeEach(async () => {
    mockPointRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
    };

    mockHistoryRepository = {
      saveHistory: jest.fn(),
      findHistoriesByUserId: jest.fn(),
      findHistoriesByOrderId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointService,
        {
          provide: POINT_REPOSITORY,
          useValue: mockPointRepository,
        },
        {
          provide: POINT_HISTORY_REPOSITORY,
          useValue: mockHistoryRepository,
        },
      ],
    }).compile();

    service = module.get<PointService>(PointService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreatePoint', () => {
    it('사용자의 포인트가 존재하면 조회한다', async () => {
      // Given
      const userId = 'user-1';
      const existingPoint = Point.create(userId);
      mockPointRepository.findByUserId.mockResolvedValue(existingPoint);

      // When
      const result = await service.getOrCreatePoint(userId);

      // Then
      expect(result).toBe(existingPoint);
      expect(mockPointRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('사용자의 포인트가 없으면 새로 생성한다', async () => {
      // Given
      const userId = 'user-1';
      mockPointRepository.findByUserId.mockResolvedValue(null);

      // When
      const result = await service.getOrCreatePoint(userId);

      // Then
      expect(result.userId).toBe(userId);
      expect(result.amount).toBe(0);
      expect(mockPointRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('charge', () => {
    it('포인트를 충전하고 이력을 기록한다', async () => {
      // Given
      const userId = 'user-1';
      const amount = 1000;
      const point = Point.create(userId);
      mockPointRepository.findByUserId.mockResolvedValue(point);
      mockPointRepository.save.mockResolvedValue(point);
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When
      const result = await service.charge(userId, amount);

      // Then
      expect(result.amount).toBe(amount);
      expect(mockPointRepository.save).toHaveBeenCalled();
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalled();

      const savedHistory = mockHistoryRepository.saveHistory.mock.calls[0][0];
      expect(savedHistory.type).toBe(PointHistoryType.CHARGE);
      expect(savedHistory.amount).toBe(amount);
      expect(savedHistory.userId).toBe(userId);
    });

    it('존재하지 않는 사용자도 포인트를 충전할 수 있다', async () => {
      // Given
      const userId = 'new-user';
      const amount = 1000;
      mockPointRepository.findByUserId.mockResolvedValue(null);
      mockPointRepository.save.mockImplementation((point) =>
        Promise.resolve(point),
      );
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When
      const result = await service.charge(userId, amount);

      // Then
      expect(result.amount).toBe(amount);
      expect(mockPointRepository.save).toHaveBeenCalled();
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalled();
    });
  });

  describe('use', () => {
    it('포인트를 사용하고 이력을 기록한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const useAmount = 500;
      const point = Point.create(userId);
      point.charge(1000);

      mockPointRepository.findByUserId.mockResolvedValue(point);
      mockPointRepository.save.mockImplementation((point) =>
        Promise.resolve(point),
      );
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When
      const result = await service.use(userId, useAmount, orderId);

      // Then
      expect(result.amount).toBe(500);
      expect(mockPointRepository.save).toHaveBeenCalled();
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalled();

      const savedHistory = mockHistoryRepository.saveHistory.mock.calls[0][0];
      expect(savedHistory.type).toBe(PointHistoryType.USE);
      expect(savedHistory.amount).toBe(-useAmount);
      expect(savedHistory.orderId).toBe(orderId);
    });

    it('포인트가 부족하면 에러가 발생한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const useAmount = 2000;
      const point = Point.create(userId);
      point.charge(1000);

      mockPointRepository.findByUserId.mockResolvedValue(point);

      // When & Then
      await expect(service.use(userId, useAmount, orderId)).rejects.toThrow(
        '포인트 잔액이 부족합니다',
      );
      expect(mockPointRepository.save).not.toHaveBeenCalled();
      expect(mockHistoryRepository.saveHistory).not.toHaveBeenCalled();
    });
  });

  describe('refund', () => {
    it('포인트를 환불하고 이력을 기록한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const refundAmount = 500;
      const point = Point.create(userId);
      point.charge(1000);
      point.use(500);

      mockPointRepository.findByUserId.mockResolvedValue(point);
      mockPointRepository.save.mockImplementation((point) =>
        Promise.resolve(point),
      );
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When
      const result = await service.refund(userId, refundAmount, orderId);

      // Then
      expect(result.amount).toBe(1000);
      expect(mockPointRepository.save).toHaveBeenCalled();
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalled();

      const savedHistory = mockHistoryRepository.saveHistory.mock.calls[0][0];
      expect(savedHistory.type).toBe(PointHistoryType.CANCEL);
      expect(savedHistory.amount).toBe(refundAmount);
      expect(savedHistory.orderId).toBe(orderId);
    });

    it('포인트가 0인 상태에서도 환불할 수 있다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const refundAmount = 500;
      const point = Point.create(userId);

      mockPointRepository.findByUserId.mockResolvedValue(point);
      mockPointRepository.save.mockImplementation((point) =>
        Promise.resolve(point),
      );
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When
      const result = await service.refund(userId, refundAmount, orderId);

      // Then
      expect(result.amount).toBe(refundAmount);
      expect(mockPointRepository.save).toHaveBeenCalled();
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalled();
    });
  });

  describe('getBalance', () => {
    it('사용자의 포인트 잔액을 조회한다', async () => {
      // Given
      const userId = 'user-1';
      const point = Point.create(userId);
      point.charge(1000);

      mockPointRepository.findByUserId.mockResolvedValue(point);

      // When
      const balance = await service.getBalance(userId);

      // Then
      expect(balance).toBe(1000);
      expect(mockPointRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('포인트가 없는 사용자는 0을 반환한다', async () => {
      // Given
      const userId = 'new-user';
      mockPointRepository.findByUserId.mockResolvedValue(null);

      // When
      const balance = await service.getBalance(userId);

      // Then
      expect(balance).toBe(0);
    });
  });

  describe('getHistories', () => {
    it('사용자의 포인트 이력을 조회한다', async () => {
      // Given
      const userId = 'user-1';
      const histories = [
        PointHistory.create(
          'history-1',
          userId,
          PointHistoryType.CHARGE,
          1000,
          1000,
        ),
        PointHistory.create(
          'history-2',
          userId,
          PointHistoryType.USE,
          -500,
          500,
          'order-1',
        ),
      ];

      mockHistoryRepository.findHistoriesByUserId.mockResolvedValue(histories);

      // When
      const result = await service.getHistories(userId);

      // Then
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(PointHistoryType.CHARGE);
      expect(result[1].type).toBe(PointHistoryType.USE);
      expect(mockHistoryRepository.findHistoriesByUserId).toHaveBeenCalledWith(
        userId,
      );
    });

    it('이력이 없으면 빈 배열을 반환한다', async () => {
      // Given
      const userId = 'user-1';
      mockHistoryRepository.findHistoriesByUserId.mockResolvedValue([]);

      // When
      const result = await service.getHistories(userId);

      // Then
      expect(result).toEqual([]);
    });
  });
});
