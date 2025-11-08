import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Point as PrismaPoint } from '@prisma/client';
import { Point } from '../domain/entity/point.entity';
import { IPointRepository } from '../domain/interface/point.repository.interface';

@Injectable()
export class PointRepository implements IPointRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private pointToDomain(row: PrismaPoint): Point {
    return Point.from(
      row.userId,
      row.amount,
      row.version,
      row.createdAt,
      row.updatedAt,
    );
  }

  // write: Entity → DB
  private pointFromDomain(
    point: Point,
  ): Omit<PrismaPoint, 'createdAt' | 'updatedAt'> {
    return {
      userId: point.userId,
      amount: point.amount,
      version: point.version,
    };
  }

  async findByUserId(userId: string): Promise<Point | null> {
    const point = await this.prisma.point.findUnique({
      where: { userId },
    });

    return point ? this.pointToDomain(point) : null;
  }

  async save(point: Point): Promise<Point> {
    const data = this.pointFromDomain(point);

    // 업데이트 (낙관적 락 적용)
    const oldVersion = point.version - 1;

    try {
      const updated = await this.prisma.point.update({
        where: {
          userId: data.userId,
          version: oldVersion, // 이전 버전과 일치해야 업데이트
        },
        data: {
          amount: data.amount,
          version: data.version,
          updatedAt: new Date(),
        },
      });

      return this.pointToDomain(updated);
    } catch (error: unknown) {
      // 낙관적 락 충돌
      throw new ConflictException(
        `포인트 업데이트 중 충돌이 발생했습니다. 다시 시도해주세요. : ${(error as Error).message}`,
      );
    }
  }
}
