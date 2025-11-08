import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
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
import { PointHistory } from '../entity/point-history.entity';

describe('PointService Integration Tests - Retry Logic', () => {
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

  describe('포인트 충전 재시도 테스트', () => {
    it('낙관적 락 충돌 시 서비스가 자동으로 재시도하여 성공한다', async () => {
      // Given
      const userId = 'user-1';
      const amount = 1000;
      const initialPoint = Point.create(userId);
      let attemptCount = 0;

      mockPointRepository.findByUserId.mockResolvedValue(initialPoint);
      mockPointRepository.save.mockImplementation(() => {
        attemptCount++;
        // 처음 2번은 실패, 3번째에 성공
        if (attemptCount < 3) {
          return Promise.reject(
            new ConflictException(
              '포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
            ),
          );
        }
        const savedPoint = Point.create(userId);
        Object.defineProperty(savedPoint, '_amount', {
          value: amount,
          writable: true,
        });
        return Promise.resolve(savedPoint);
      });
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When - 서비스가 내부적으로 재시도 처리
      const result = await service.charge(userId, amount);

      // Then
      expect(result.amount).toBe(amount);
      expect(attemptCount).toBe(3); // 2번 실패 후 3번째 성공
      expect(mockPointRepository.save).toHaveBeenCalledTimes(3);
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalledTimes(1);
    });

    it('여러 사용자가 동시에 포인트를 충전할 때 서비스의 재시도 로직으로 처리된다', async () => {
      // Given
      const userId = 'user-1';
      const initialAmount = 0;
      let currentVersion = 0;
      let currentAmount = initialAmount;

      mockPointRepository.findByUserId.mockImplementation(() => {
        const point = Point.create(userId);
        Object.defineProperty(point, '_amount', {
          value: currentAmount,
          writable: true,
        });
        Object.defineProperty(point, '_version', {
          value: currentVersion,
          writable: true,
        });
        return Promise.resolve(point);
      });

      mockPointRepository.save.mockImplementation((point: Point) => {
        // 낙관적 락 시뮬레이션
        if (point.version - 1 !== currentVersion) {
          return Promise.reject(
            new ConflictException(
              '포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
            ),
          );
        }

        currentAmount = point.amount;
        currentVersion = point.version;

        const savedPoint = Point.create(userId);
        Object.defineProperty(savedPoint, '_amount', {
          value: currentAmount,
          writable: true,
        });
        Object.defineProperty(savedPoint, '_version', {
          value: currentVersion,
          writable: true,
        });
        return Promise.resolve(savedPoint);
      });

      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When - 동시에 5번의 충전 요청 (서비스의 재시도 로직 사용)
      const concurrentRequests = 5;
      const chargeAmount = 1000;
      const promises: Promise<Point>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(service.charge(userId, chargeAmount));
      }

      await Promise.all(promises);

      // Then
      expect(currentAmount).toBe(concurrentRequests * chargeAmount);
      expect(currentVersion).toBe(concurrentRequests);
      expect(mockPointRepository.save.mock.calls.length).toBeGreaterThanOrEqual(
        concurrentRequests,
      );
    });
  });

  describe('포인트 사용 재시도 테스트', () => {
    it('낙관적 락 충돌 시 서비스가 자동으로 재시도하여 성공한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const useAmount = 500;

      let attemptCount = 0;

      // 매번 새로운 포인트 객체를 반환하도록 수정
      mockPointRepository.findByUserId.mockImplementation(() => {
        const point = Point.create(userId);
        Object.defineProperty(point, '_amount', {
          value: 1000,
          writable: true,
        });
        return Promise.resolve(point);
      });

      mockPointRepository.save.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(
            new ConflictException(
              '포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
            ),
          );
        }
        const savedPoint = Point.create(userId);
        Object.defineProperty(savedPoint, '_amount', {
          value: 500,
          writable: true,
        });
        return Promise.resolve(savedPoint);
      });
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When - 서비스가 내부적으로 재시도 처리
      const result = await service.use(userId, useAmount, orderId);

      // Then
      expect(result.amount).toBe(500);
      expect(attemptCount).toBe(3);
      expect(mockPointRepository.save).toHaveBeenCalledTimes(3);
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalledTimes(1);
    });

    it('포인트 부족 에러는 재시도 없이 즉시 실패한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const useAmount = 2000;
      const initialPoint = Point.create(userId);
      Object.defineProperty(initialPoint, '_amount', {
        value: 1000,
        writable: true,
      });

      mockPointRepository.findByUserId.mockResolvedValue(initialPoint);

      // When & Then
      await expect(service.use(userId, useAmount, orderId)).rejects.toThrow(
        '포인트 잔액이 부족합니다',
      );

      // 재시도 없이 save 호출 안 됨 (도메인 레벨에서 검증)
      expect(mockPointRepository.save).not.toHaveBeenCalled();
      expect(mockHistoryRepository.saveHistory).not.toHaveBeenCalled();
    });
  });

  describe('포인트 환불 재시도 테스트', () => {
    it('낙관적 락 충돌 시 서비스가 자동으로 재시도하여 성공한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const refundAmount = 500;
      const initialPoint = Point.create(userId);
      Object.defineProperty(initialPoint, '_amount', {
        value: 1000,
        writable: true,
      });

      let attemptCount = 0;

      mockPointRepository.findByUserId.mockResolvedValue(initialPoint);
      mockPointRepository.save.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(
            new ConflictException(
              '포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
            ),
          );
        }
        const savedPoint = Point.create(userId);
        Object.defineProperty(savedPoint, '_amount', {
          value: 1500,
          writable: true,
        });
        return Promise.resolve(savedPoint);
      });
      mockHistoryRepository.saveHistory.mockResolvedValue({} as PointHistory);

      // When - 서비스가 내부적으로 재시도 처리
      const result = await service.refund(userId, refundAmount, orderId);

      // Then
      expect(result.amount).toBe(1500);
      expect(attemptCount).toBe(3);
      expect(mockPointRepository.save).toHaveBeenCalledTimes(3);
      expect(mockHistoryRepository.saveHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('최대 재시도 횟수 초과 테스트', () => {
    it('charge: 최대 재시도 횟수를 초과하면 에러를 throw 한다', async () => {
      // Given
      const userId = 'user-1';
      const amount = 1000;
      const initialPoint = Point.create(userId);

      mockPointRepository.findByUserId.mockResolvedValue(initialPoint);
      mockPointRepository.save.mockRejectedValue(
        new ConflictException(
          '포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
        ),
      );

      // When & Then
      await expect(service.charge(userId, amount)).rejects.toThrow(
        ConflictException,
      );

      // 최대 5회 재시도 확인
      expect(mockPointRepository.save).toHaveBeenCalledTimes(5);
      expect(mockHistoryRepository.saveHistory).not.toHaveBeenCalled();
    });

    it('use: 최대 재시도 횟수를 초과하면 에러를 throw 한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const amount = 500;

      // 매번 새로운 포인트 객체를 반환하도록 수정
      mockPointRepository.findByUserId.mockImplementation(() => {
        const point = Point.create(userId);
        Object.defineProperty(point, '_amount', {
          value: 1000,
          writable: true,
        });
        return Promise.resolve(point);
      });

      mockPointRepository.save.mockRejectedValue(
        new ConflictException(
          '포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
        ),
      );

      // When & Then
      await expect(service.use(userId, amount, orderId)).rejects.toThrow(
        ConflictException,
      );

      // 최대 5회 재시도 확인
      expect(mockPointRepository.save).toHaveBeenCalledTimes(5);
      expect(mockHistoryRepository.saveHistory).not.toHaveBeenCalled();
    });

    it('refund: 최대 재시도 횟수를 초과하면 에러를 throw 한다', async () => {
      // Given
      const userId = 'user-1';
      const orderId = 'order-1';
      const amount = 500;
      const initialPoint = Point.create(userId);

      mockPointRepository.findByUserId.mockResolvedValue(initialPoint);
      mockPointRepository.save.mockRejectedValue(
        new ConflictException(
          '포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요.',
        ),
      );

      // When & Then
      await expect(service.refund(userId, amount, orderId)).rejects.toThrow(
        ConflictException,
      );

      // 최대 5회 재시도 확인
      expect(mockPointRepository.save).toHaveBeenCalledTimes(5);
      expect(mockHistoryRepository.saveHistory).not.toHaveBeenCalled();
    });
  });
});
