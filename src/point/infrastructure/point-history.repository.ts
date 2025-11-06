import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PointHistory as PrismaPointHistory } from '@prisma/client';
import {
  PointHistory,
  PointHistoryType,
} from '../domain/entity/point-history.entity';
import { IPointHistoryRepository } from '../domain/interface/point-history.repository.interface';

@Injectable()
export class PointHistoryRepository implements IPointHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private historyToDomain(row: PrismaPointHistory): PointHistory {
    return PointHistory.from(
      row.id,
      row.userId,
      row.orderId,
      row.type as PointHistoryType,
      row.amount,
      row.balance,
      row.createdAt,
    );
  }

  // write: Entity → DB
  private historyFromDomain(
    history: PointHistory,
  ): Omit<PrismaPointHistory, 'createdAt'> {
    return {
      id: history.id,
      userId: history.userId,
      orderId: history.orderId,
      type: history.type,
      amount: history.amount,
      balance: history.balance,
    };
  }

  async saveHistory(history: PointHistory): Promise<PointHistory> {
    const data = this.historyFromDomain(history);

    const created = await this.prisma.pointHistory.create({
      data,
    });

    return this.historyToDomain(created);
  }

  async findHistoriesByUserId(userId: string): Promise<PointHistory[]> {
    const histories = await this.prisma.pointHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return histories.map((h) => this.historyToDomain(h));
  }

  async findHistoriesByOrderId(orderId: string): Promise<PointHistory[]> {
    const histories = await this.prisma.pointHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return histories.map((h) => this.historyToDomain(h));
  }
}
