import { PointHistoryType } from '../../domain/entity/point-history.entity';

export class PointHistoryResponseDto {
  id: string;
  orderId: string | null;
  type: PointHistoryType;
  amount: number;
  balance: number;
  createdAt: Date;
}
