import { PointHistory } from '../entity/point-history.entity';

export const POINT_HISTORY_REPOSITORY = Symbol('POINT_HISTORY_REPOSITORY');

export interface IPointHistoryRepository {
  // PointHistory 저장
  saveHistory(history: PointHistory): Promise<PointHistory>;

  // PointHistory 조회
  findHistoriesByUserId(userId: string): Promise<PointHistory[]>;

  // 특정 주문의 PointHistory 조회
  findHistoriesByOrderId(orderId: string): Promise<PointHistory[]>;
}
