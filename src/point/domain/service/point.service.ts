import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Point } from '../entity/point.entity';
import { PointHistory, PointHistoryType } from '../entity/point-history.entity';
import {
  IPointRepository,
  POINT_REPOSITORY,
} from '../interface/point.repository.interface';
import {
  IPointHistoryRepository,
  POINT_HISTORY_REPOSITORY,
} from '../interface/point-history.repository.interface';

@Injectable()
export class PointService {
  private readonly logger = new Logger(PointService.name);

  constructor(
    @Inject(POINT_REPOSITORY)
    private readonly pointRepository: IPointRepository,
    @Inject(POINT_HISTORY_REPOSITORY)
    private readonly pointHistoryRepository: IPointHistoryRepository,
  ) {}

  // 포인트 조회 또는 생성
  async getOrCreatePoint(userId: string): Promise<Point> {
    const point = await this.pointRepository.findByUserId(userId);

    if (!point) {
      return Point.create(userId);
    }

    return point;
  }

  // 포인트 충전
  async charge(userId: string, amount: number): Promise<Point> {
    const maxRetries = 5;
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const point = await this.getOrCreatePoint(userId);

        // 포인트 충전
        point.charge(amount);

        // 포인트 저장 (낙관적 락 적용)
        const savedPoint = await this.pointRepository.save(point);

        // 충전 이력 기록
        const history = PointHistory.create(
          randomUUID(),
          userId,
          PointHistoryType.CHARGE,
          amount,
          savedPoint.amount,
        );
        await this.pointHistoryRepository.saveHistory(history);

        return savedPoint;
      } catch (error) {
        lastError = error as Error;

        // 낙관적 락 충돌인 경우에만 재시도
        if (
          error instanceof Error &&
          error.message.includes('포인트 업데이트 중 충돌') &&
          attempt < maxRetries - 1
        ) {
          this.logger.warn(
            `포인트 충전 충돌 발생 (시도 ${attempt + 1}/${maxRetries}). 재시도 중...`,
          );
          // 지수 백오프: 50ms * (attempt + 1)
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * (attempt + 1)),
          );
          continue;
        }

        // 다른 예외는 즉시 throw
        throw error;
      }
    }

    // 최대 재시도 횟수 초과
    throw lastError!;
  }

  // 포인트 사용 (주문 시)
  async use(userId: string, amount: number, orderId: string): Promise<Point> {
    const maxRetries = 5;
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const point = await this.getOrCreatePoint(userId);

        // 포인트 사용
        point.use(amount);

        // 포인트 저장 (낙관적 락 적용)
        const savedPoint = await this.pointRepository.save(point);

        // 사용 이력 기록
        const history = PointHistory.create(
          randomUUID(),
          userId,
          PointHistoryType.USE,
          -amount, // 사용은 음수로 기록
          savedPoint.amount,
          orderId,
        );
        await this.pointHistoryRepository.saveHistory(history);

        return savedPoint;
      } catch (error) {
        lastError = error as Error;

        // 낙관적 락 충돌인 경우에만 재시도
        if (
          error instanceof Error &&
          error.message.includes('포인트 업데이트 중 충돌') &&
          attempt < maxRetries - 1
        ) {
          this.logger.warn(
            `포인트 사용 충돌 발생 (시도 ${attempt + 1}/${maxRetries}). 재시도 중...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * (attempt + 1)),
          );
          continue;
        }

        // 다른 예외(포인트 부족 등)는 즉시 throw
        throw error;
      }
    }

    // 최대 재시도 횟수 초과
    throw lastError!;
  }

  // 포인트 환불 (주문 취소 시)
  async refund(
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<Point> {
    const maxRetries = 5;
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const point = await this.getOrCreatePoint(userId);

        // 포인트 환불
        point.refund(amount);

        // 포인트 저장 (낙관적 락 적용)
        const savedPoint = await this.pointRepository.save(point);

        // 환불 이력 기록
        const history = PointHistory.create(
          randomUUID(),
          userId,
          PointHistoryType.CANCEL,
          amount,
          savedPoint.amount,
          orderId,
        );
        await this.pointHistoryRepository.saveHistory(history);

        return savedPoint;
      } catch (error) {
        lastError = error as Error;

        // 낙관적 락 충돌인 경우에만 재시도
        if (
          error instanceof Error &&
          error.message.includes('포인트 업데이트 중 충돌') &&
          attempt < maxRetries - 1
        ) {
          this.logger.warn(
            `포인트 환불 충돌 발생 (시도 ${attempt + 1}/${maxRetries}). 재시도 중...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * (attempt + 1)),
          );
          continue;
        }

        // 다른 예외는 즉시 throw
        throw error;
      }
    }

    // 최대 재시도 횟수 초과
    throw lastError!;
  }

  // 포인트 잔액 조회
  async getBalance(userId: string): Promise<number> {
    const point = await this.getOrCreatePoint(userId);
    return point.amount;
  }

  // 포인트 이력 조회
  async getHistories(userId: string): Promise<PointHistory[]> {
    return this.pointHistoryRepository.findHistoriesByUserId(userId);
  }
}
