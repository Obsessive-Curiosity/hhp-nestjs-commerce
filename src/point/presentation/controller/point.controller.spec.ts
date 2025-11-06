import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointFacade } from '../../application/point.facade';
import { ChargePointDto } from '../dto/charge-point.dto';
import { Payload } from '@/types/express';
import { Role } from '@prisma/client';
import { PointHistoryType } from '../../domain/entity/point-history.entity';

describe('PointController', () => {
  let controller: PointController;
  let mockPointFacade: jest.Mocked<PointFacade>;

  const mockUser: Payload = {
    sub: 'user-1',
    email: 'test@example.com',
    role: Role.RETAILER,
  };

  beforeEach(async () => {
    mockPointFacade = {
      charge: jest.fn(),
      getBalance: jest.fn(),
      getHistories: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointController],
      providers: [
        {
          provide: PointFacade,
          useValue: mockPointFacade,
        },
      ],
    }).compile();

    controller = module.get<PointController>(PointController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('GET /point/balance - 포인트 잔액을 조회한다', async () => {
      // Given
      const balanceResponse = {
        balance: 1000,
        updatedAt: new Date(),
      };
      mockPointFacade.getBalance.mockResolvedValue(balanceResponse);

      // When
      const result = await controller.getBalance(mockUser);

      // Then
      expect(result).toEqual(balanceResponse);
      expect(mockPointFacade.getBalance).toHaveBeenCalledWith(mockUser.sub);
    });

    it('포인트가 0인 경우에도 정상적으로 조회한다', async () => {
      // Given
      const balanceResponse = {
        balance: 0,
        updatedAt: new Date(),
      };
      mockPointFacade.getBalance.mockResolvedValue(balanceResponse);

      // When
      const result = await controller.getBalance(mockUser);

      // Then
      expect(result.balance).toBe(0);
    });
  });

  describe('charge', () => {
    it('POST /point/charge - 포인트를 충전한다', async () => {
      // Given
      const dto: ChargePointDto = { amount: 1000 };
      const chargeResponse = {
        balance: 1000,
        updatedAt: new Date(),
      };
      mockPointFacade.charge.mockResolvedValue(chargeResponse);

      // When
      const result = await controller.charge(mockUser, dto);

      // Then
      expect(result).toEqual({
        message: '포인트가 충전되었습니다.',
        data: chargeResponse,
      });
      expect(mockPointFacade.charge).toHaveBeenCalledWith(mockUser.sub, dto);
    });

    it('소액 충전도 정상적으로 처리한다', async () => {
      // Given
      const dto: ChargePointDto = { amount: 100 };
      const chargeResponse = {
        balance: 100,
        updatedAt: new Date(),
      };
      mockPointFacade.charge.mockResolvedValue(chargeResponse);

      // When
      const result = await controller.charge(mockUser, dto);

      // Then
      expect(result.data.balance).toBe(100);
      expect(mockPointFacade.charge).toHaveBeenCalledWith(mockUser.sub, dto);
    });

    it('대액 충전도 정상적으로 처리한다', async () => {
      // Given
      const dto: ChargePointDto = { amount: 1000000 };
      const chargeResponse = {
        balance: 1000000,
        updatedAt: new Date(),
      };
      mockPointFacade.charge.mockResolvedValue(chargeResponse);

      // When
      const result = await controller.charge(mockUser, dto);

      // Then
      expect(result.data.balance).toBe(1000000);
    });
  });

  describe('getHistory', () => {
    it('GET /point/history - 포인트 이력을 조회한다', async () => {
      // Given
      const histories = [
        {
          id: 'history-1',
          orderId: null,
          type: PointHistoryType.CHARGE,
          amount: 1000,
          balance: 1000,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'history-2',
          orderId: 'order-1',
          type: PointHistoryType.USE,
          amount: -500,
          balance: 500,
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'history-3',
          orderId: 'order-1',
          type: PointHistoryType.CANCEL,
          amount: 500,
          balance: 1000,
          createdAt: new Date('2024-01-03'),
        },
      ];
      mockPointFacade.getHistories.mockResolvedValue(histories);

      // When
      const result = await controller.getHistory(mockUser);

      // Then
      expect(result).toEqual(histories);
      expect(result).toHaveLength(3);
      expect(mockPointFacade.getHistories).toHaveBeenCalledWith(mockUser.sub);
    });

    it('이력이 없으면 빈 배열을 반환한다', async () => {
      // Given
      mockPointFacade.getHistories.mockResolvedValue([]);

      // When
      const result = await controller.getHistory(mockUser);

      // Then
      expect(result).toEqual([]);
    });

    it('충전 이력만 있는 경우', async () => {
      // Given
      const histories = [
        {
          id: 'history-1',
          orderId: null,
          type: PointHistoryType.CHARGE,
          amount: 1000,
          balance: 1000,
          createdAt: new Date(),
        },
      ];
      mockPointFacade.getHistories.mockResolvedValue(histories);

      // When
      const result = await controller.getHistory(mockUser);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(PointHistoryType.CHARGE);
      expect(result[0].orderId).toBeNull();
    });

    it('주문 관련 이력(사용, 환불)은 orderId를 포함한다', async () => {
      // Given
      const histories = [
        {
          id: 'history-1',
          orderId: 'order-1',
          type: PointHistoryType.USE,
          amount: -500,
          balance: 500,
          createdAt: new Date(),
        },
        {
          id: 'history-2',
          orderId: 'order-1',
          type: PointHistoryType.CANCEL,
          amount: 500,
          balance: 1000,
          createdAt: new Date(),
        },
      ];
      mockPointFacade.getHistories.mockResolvedValue(histories);

      // When
      const result = await controller.getHistory(mockUser);

      // Then
      expect(result[0].orderId).toBe('order-1');
      expect(result[1].orderId).toBe('order-1');
    });
  });

  describe('error handling', () => {
    it('facade에서 에러가 발생하면 그대로 전파한다', async () => {
      // Given
      const error = new Error('Service error');
      mockPointFacade.getBalance.mockRejectedValue(error);

      // When & Then
      await expect(controller.getBalance(mockUser)).rejects.toThrow(
        'Service error',
      );
    });

    it('충전 중 에러가 발생하면 그대로 전파한다', async () => {
      // Given
      const dto: ChargePointDto = { amount: 1000 };
      const error = new Error('Charge failed');
      mockPointFacade.charge.mockRejectedValue(error);

      // When & Then
      await expect(controller.charge(mockUser, dto)).rejects.toThrow(
        'Charge failed',
      );
    });
  });
});
