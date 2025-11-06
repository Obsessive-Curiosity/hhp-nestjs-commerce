import { Test, TestingModule } from '@nestjs/testing';
import { PointFacade } from './point.facade';
import { PointService } from '../domain/service/point.service';
import { Point } from '../domain/entity/point.entity';
import { PointHistory, PointHistoryType } from '../domain/entity/point-history.entity';
import { ChargePointDto } from '../presentation/dto/charge-point.dto';

describe('PointFacade', () => {
  let facade: PointFacade;
  let mockPointService: jest.Mocked<PointService>;

  beforeEach(async () => {
    mockPointService = {
      charge: jest.fn(),
      use: jest.fn(),
      refund: jest.fn(),
      getOrCreatePoint: jest.fn(),
      getBalance: jest.fn(),
      getHistories: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointFacade,
        {
          provide: PointService,
          useValue: mockPointService,
        },
      ],
    }).compile();

    facade = module.get<PointFacade>(PointFacade);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('charge', () => {
    it('포인트를 충전하고 잔액 정보를 반환한다', async () => {
      // Given
      const userId = 'user-1';
      const dto: ChargePointDto = { amount: 1000 };
      const point = Point.create(userId);
      point.charge(1000);

      mockPointService.charge.mockResolvedValue(point);

      // When
      const result = await facade.charge(userId, dto);

      // Then
      expect(result).toEqual({
        balance: 1000,
        updatedAt: point.updatedAt,
      });
      expect(mockPointService.charge).toHaveBeenCalledWith(userId, dto.amount);
    });

    it('여러 번 충전 시 누적된 잔액을 반환한다', async () => {
      // Given
      const userId = 'user-1';
      const dto: ChargePointDto = { amount: 500 };
      const point = Point.create(userId);
      point.charge(1000);
      point.charge(500);

      mockPointService.charge.mockResolvedValue(point);

      // When
      const result = await facade.charge(userId, dto);

      // Then
      expect(result.balance).toBe(1500);
      expect(mockPointService.charge).toHaveBeenCalledWith(userId, 500);
    });
  });

  describe('getBalance', () => {
    it('사용자의 포인트 잔액을 조회한다', async () => {
      // Given
      const userId = 'user-1';
      const point = Point.create(userId);
      point.charge(1000);

      mockPointService.getOrCreatePoint.mockResolvedValue(point);

      // When
      const result = await facade.getBalance(userId);

      // Then
      expect(result).toEqual({
        balance: 1000,
        updatedAt: point.updatedAt,
      });
      expect(mockPointService.getOrCreatePoint).toHaveBeenCalledWith(userId);
    });

    it('포인트가 없는 신규 사용자는 0을 반환한다', async () => {
      // Given
      const userId = 'new-user';
      const point = Point.create(userId);

      mockPointService.getOrCreatePoint.mockResolvedValue(point);

      // When
      const result = await facade.getBalance(userId);

      // Then
      expect(result.balance).toBe(0);
    });
  });

  describe('getHistories', () => {
    it('사용자의 포인트 이력을 조회하여 DTO로 변환한다', async () => {
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
        PointHistory.create(
          'history-3',
          userId,
          PointHistoryType.CANCEL,
          500,
          1000,
          'order-1',
        ),
      ];

      mockPointService.getHistories.mockResolvedValue(histories);

      // When
      const result = await facade.getHistories(userId);

      // Then
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'history-1',
        orderId: null,
        type: PointHistoryType.CHARGE,
        amount: 1000,
        balance: 1000,
        createdAt: histories[0].createdAt,
      });
      expect(result[1]).toEqual({
        id: 'history-2',
        orderId: 'order-1',
        type: PointHistoryType.USE,
        amount: -500,
        balance: 500,
        createdAt: histories[1].createdAt,
      });
      expect(result[2]).toEqual({
        id: 'history-3',
        orderId: 'order-1',
        type: PointHistoryType.CANCEL,
        amount: 500,
        balance: 1000,
        createdAt: histories[2].createdAt,
      });
      expect(mockPointService.getHistories).toHaveBeenCalledWith(userId);
    });

    it('이력이 없으면 빈 배열을 반환한다', async () => {
      // Given
      const userId = 'user-1';
      mockPointService.getHistories.mockResolvedValue([]);

      // When
      const result = await facade.getHistories(userId);

      // Then
      expect(result).toEqual([]);
    });

    it('orderId가 없는 이력도 올바르게 변환한다', async () => {
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
      ];

      mockPointService.getHistories.mockResolvedValue(histories);

      // When
      const result = await facade.getHistories(userId);

      // Then
      expect(result[0].orderId).toBeNull();
    });
  });

  describe('error handling', () => {
    it('서비스에서 에러가 발생하면 그대로 전파한다', async () => {
      // Given
      const userId = 'user-1';
      const dto: ChargePointDto = { amount: 1000 };
      const error = new Error('Database error');

      mockPointService.charge.mockRejectedValue(error);

      // When & Then
      await expect(facade.charge(userId, dto)).rejects.toThrow('Database error');
    });
  });
});
