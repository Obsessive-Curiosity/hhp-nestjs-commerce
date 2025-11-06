import { Injectable } from '@nestjs/common';
import { PointService } from '../domain/service/point.service';
import { ChargePointDto } from '../presentation/dto/charge-point.dto';
import { PointBalanceResponseDto } from '../presentation/dto/point-balance-response.dto';
import { PointHistoryResponseDto } from '../presentation/dto/point-history-response.dto';

@Injectable()
export class PointFacade {
  constructor(private readonly pointService: PointService) {}

  // 포인트 충전
  async charge(
    userId: string,
    dto: ChargePointDto,
  ): Promise<PointBalanceResponseDto> {
    const point = await this.pointService.charge(userId, dto.amount);

    return {
      balance: point.amount,
      updatedAt: point.updatedAt,
    };
  }

  // 포인트 잔액 조회
  async getBalance(userId: string): Promise<PointBalanceResponseDto> {
    const point = await this.pointService.getOrCreatePoint(userId);

    return {
      balance: point.amount,
      updatedAt: point.updatedAt,
    };
  }

  // 포인트 사용 내역 조회
  async getHistories(userId: string): Promise<PointHistoryResponseDto[]> {
    const histories = await this.pointService.getHistories(userId);

    return histories.map((h) => ({
      id: h.id,
      orderId: h.orderId,
      type: h.type,
      amount: h.amount,
      balance: h.balance,
      createdAt: h.createdAt,
    }));
  }
}
