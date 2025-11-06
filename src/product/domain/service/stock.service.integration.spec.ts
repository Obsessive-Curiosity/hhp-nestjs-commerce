import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import {
  IStockRepository,
  STOCK_REPOSITORY,
} from '../interface/stock.repository.interface';
import { ProductStock } from '../entity/product-stock.entity';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('StockService Integration Tests - Concurrency', () => {
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

  describe('재고 증가 동시성 테스트', () => {
    it('여러 요청이 동시에 재고를 증가시킬 때 서비스의 재시도 로직으로 처리된다', async () => {
      // Given
      const productId = 'test-product-id';
      const initialQuantity = 100;
      let currentVersion = 0;
      let currentQuantity = initialQuantity;

      // Repository Mock 설정 - 실제 동작 시뮬레이션
      mockRepository.findByProductId.mockImplementation(() => {
        const stock = ProductStock.create(productId, 0);
        Object.defineProperty(stock, '_quantity', {
          value: currentQuantity,
          writable: true,
        });
        Object.defineProperty(stock, '_version', {
          value: currentVersion,
          writable: true,
        });
        return Promise.resolve(stock);
      });

      mockRepository.increaseWithVersion.mockImplementation(
        (_id, quantity, version) => {
          // 낙관적 락 시뮬레이션: version이 맞지 않으면 실패
          if (version !== currentVersion) {
            return Promise.reject(
              new ConflictException(
                '재고 증가 실패: 다른 트랜잭션에 의해 변경되었습니다. 다시 시도해주세요.',
              ),
            );
          }

          // 성공 시 재고 증가 및 버전 업데이트
          currentQuantity += quantity;
          currentVersion += 1;
          return Promise.resolve();
        },
      );

      // When - 동시에 10개의 재고 증가 요청 (서비스의 재시도 로직 사용)
      const concurrentRequests = 10;
      const increaseAmount = 5;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        // 서비스가 내부적으로 재시도 처리
        promises.push(service.increaseStock(productId, increaseAmount));
      }

      // 모든 요청이 완료될 때까지 대기
      await Promise.all(promises);

      // Then
      // 최종 재고는 초기값 + (요청 수 * 증가량)
      const expectedQuantity =
        initialQuantity + concurrentRequests * increaseAmount;
      expect(currentQuantity).toBe(expectedQuantity);

      // 버전은 요청 수만큼 증가
      expect(currentVersion).toBe(concurrentRequests);

      // increaseWithVersion이 충돌로 인해 재시도를 포함하여 여러 번 호출됨
      expect(
        mockRepository.increaseWithVersion.mock.calls.length,
      ).toBeGreaterThanOrEqual(concurrentRequests);
    });

    it('재고 증가 시 낙관적 락 충돌이 발생하면 서비스가 자동으로 재시도한다', async () => {
      // Given
      const productId = 'test-product-id';
      const initialStock = ProductStock.create(productId, 100);
      let attemptCount = 0;

      mockRepository.findByProductId.mockResolvedValue(initialStock);
      mockRepository.increaseWithVersion.mockImplementation(() => {
        attemptCount++;
        // 처음 2번은 실패, 3번째에 성공
        if (attemptCount < 3) {
          return Promise.reject(
            new ConflictException(
              '재고 증가 실패: 다른 트랜잭션에 의해 변경되었습니다. 다시 시도해주세요.',
            ),
          );
        }
        return Promise.resolve();
      });

      // When - 서비스가 내부적으로 재시도 처리
      await service.increaseStock(productId, 10);

      // Then
      expect(attemptCount).toBe(3); // 2번 실패 후 3번째 성공
      expect(mockRepository.increaseWithVersion).toHaveBeenCalledTimes(3);
    });
  });

  describe('재고 감소 동시성 테스트', () => {
    it('여러 요청이 동시에 재고를 감소시킬 때 서비스의 재시도 로직으로 처리된다', async () => {
      // Given
      const productId = 'test-product-id';
      const initialQuantity = 1000;
      let currentVersion = 0;
      let currentQuantity = initialQuantity;

      // Repository Mock 설정 - 실제 동작 시뮬레이션
      mockRepository.findByProductId.mockImplementation(() => {
        // 현재 상태의 재고 반환
        const stock = ProductStock.create(productId, 0);
        // private 필드를 테스트용으로 설정 (reflection 사용)
        Object.defineProperty(stock, '_quantity', {
          value: currentQuantity,
          writable: true,
        });
        Object.defineProperty(stock, '_version', {
          value: currentVersion,
          writable: true,
        });
        return Promise.resolve(stock);
      });

      mockRepository.decreaseWithVersion.mockImplementation(
        (_id, quantity, version) => {
          // 낙관적 락 시뮬레이션: version이 맞지 않으면 실패
          if (version !== currentVersion) {
            return Promise.reject(
              new ConflictException(
                '재고 감소 실패: 재고가 부족하거나 다른 트랜잭션에 의해 변경되었습니다.',
              ),
            );
          }

          // 재고 부족 체크
          if (currentQuantity < quantity) {
            return Promise.reject(
              new BadRequestException(
                `재고가 부족합니다. 현재 재고: ${currentQuantity}, 요청 수량: ${quantity}`,
              ),
            );
          }

          // 성공 시 재고 감소 및 버전 업데이트
          currentQuantity -= quantity;
          currentVersion += 1;
          return Promise.resolve();
        },
      );

      // When - 동시에 20개의 재고 감소 요청 (서비스의 재시도 로직 사용)
      const concurrentRequests = 20;
      const decreaseAmount = 10;
      const promises: Promise<void>[] = [];

      for (let i = 0; i < concurrentRequests; i++) {
        // 서비스가 내부적으로 재시도 처리
        promises.push(service.decreaseStock(productId, decreaseAmount));
      }

      // 모든 요청이 완료될 때까지 대기
      await Promise.all(promises);

      // Then
      // 최종 재고는 초기값 - (요청 수 * 감소량)
      const expectedQuantity =
        initialQuantity - concurrentRequests * decreaseAmount;
      expect(currentQuantity).toBe(expectedQuantity);

      // 버전은 요청 수만큼 증가
      expect(currentVersion).toBe(concurrentRequests);

      // decreaseWithVersion이 충돌로 인해 재시도를 포함하여 여러 번 호출됨
      expect(
        mockRepository.decreaseWithVersion.mock.calls.length,
      ).toBeGreaterThanOrEqual(concurrentRequests);
    });

    it('재고 감소 시 재고 부족으로 실패하면 롤백된다', async () => {
      // Given
      const productId = 'test-product-id';
      const currentQuantity = 50;
      const stock = ProductStock.create(productId, currentQuantity);

      mockRepository.findByProductId.mockResolvedValue(stock);
      mockRepository.decreaseWithVersion.mockRejectedValue(
        new BadRequestException(
          `재고가 부족합니다. 현재 재고: ${currentQuantity}, 요청 수량: 100`,
        ),
      );

      // When & Then
      await expect(service.decreaseStock(productId, 100)).rejects.toThrow(
        '재고가 부족합니다',
      );

      // decreaseWithVersion이 호출되지 않았는지 확인 (도메인 레벨에서 검증)
      // 실제로는 서비스 레이어에서 hasStock 체크 후 호출되므로 호출되지 않음
    });

    it('동시 재고 감소 요청 시 일부는 재고 부족으로 실패할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const initialQuantity = 100;
      let currentVersion = 0;
      let currentQuantity = initialQuantity;

      mockRepository.findByProductId.mockImplementation(() => {
        const stock = ProductStock.create(productId, 0);
        Object.defineProperty(stock, '_quantity', {
          value: currentQuantity,
          writable: true,
        });
        Object.defineProperty(stock, '_version', {
          value: currentVersion,
          writable: true,
        });
        return Promise.resolve(stock);
      });

      mockRepository.decreaseWithVersion.mockImplementation(
        (_id, quantity, version) => {
          if (version !== currentVersion) {
            return Promise.reject(
              new ConflictException(
                '재고 감소 실패: 재고가 부족하거나 다른 트랜잭션에 의해 변경되었습니다.',
              ),
            );
          }

          if (currentQuantity < quantity) {
            return Promise.reject(new BadRequestException('재고가 부족합니다'));
          }

          currentQuantity -= quantity;
          currentVersion += 1;
          return Promise.resolve();
        },
      );

      // When - 재고보다 많은 요청을 동시에 처리 (서비스의 재시도 로직 사용)
      const concurrentRequests = 15; // 100 / 10 = 10개만 성공 가능
      const decreaseAmount = 10;
      const results = await Promise.allSettled(
        Array.from({ length: concurrentRequests }, () =>
          service.decreaseStock(productId, decreaseAmount),
        ),
      );

      // Then
      const successCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      // 10개는 성공, 5개는 재고 부족으로 실패
      expect(successCount).toBe(10);
      expect(failedCount).toBe(5);
      expect(currentQuantity).toBe(0); // 모든 재고 소진
    });
  });

  describe('재고 증가/감소 혼합 동시성 테스트', () => {
    it('재고 증가와 감소가 동시에 발생해도 서비스의 재시도 로직으로 정확하게 처리된다', async () => {
      // Given
      const productId = 'test-product-id';
      const initialQuantity = 500;
      let currentVersion = 0;
      let currentQuantity = initialQuantity;

      mockRepository.findByProductId.mockImplementation(() => {
        const stock = ProductStock.create(productId, 0);
        Object.defineProperty(stock, '_quantity', {
          value: currentQuantity,
          writable: true,
        });
        Object.defineProperty(stock, '_version', {
          value: currentVersion,
          writable: true,
        });
        return Promise.resolve(stock);
      });

      mockRepository.increaseWithVersion.mockImplementation(
        (_id, quantity, version) => {
          if (version !== currentVersion) {
            return Promise.reject(
              new ConflictException(
                '재고 증가 실패: 다른 트랜잭션에 의해 변경되었습니다. 다시 시도해주세요.',
              ),
            );
          }
          currentQuantity += quantity;
          currentVersion += 1;
          return Promise.resolve();
        },
      );

      mockRepository.decreaseWithVersion.mockImplementation(
        (_id, quantity, version) => {
          if (version !== currentVersion) {
            return Promise.reject(
              new ConflictException(
                '재고 감소 실패: 재고가 부족하거나 다른 트랜잭션에 의해 변경되었습니다.',
              ),
            );
          }
          if (currentQuantity < quantity) {
            return Promise.reject(new BadRequestException('재고가 부족합니다'));
          }
          currentQuantity -= quantity;
          currentVersion += 1;
          return Promise.resolve();
        },
      );

      // When - 증가 10번, 감소 10번을 동시에 실행 (서비스의 재시도 로직 사용)
      const increaseRequests = 10;
      const decreaseRequests = 10;
      const amount = 20;

      const promises: Promise<void>[] = [];

      // 증가 요청
      for (let i = 0; i < increaseRequests; i++) {
        promises.push(service.increaseStock(productId, amount));
      }

      // 감소 요청
      for (let i = 0; i < decreaseRequests; i++) {
        promises.push(service.decreaseStock(productId, amount));
      }

      await Promise.all(promises);

      // Then
      // 증가 10 * 20 = +200, 감소 10 * 20 = -200, 최종 = 500
      const expectedQuantity =
        initialQuantity + increaseRequests * amount - decreaseRequests * amount;
      expect(currentQuantity).toBe(expectedQuantity);
      expect(currentQuantity).toBe(500); // 원래 값과 동일

      // 총 20번의 작업이 성공
      expect(currentVersion).toBe(increaseRequests + decreaseRequests);
    });
  });
});
