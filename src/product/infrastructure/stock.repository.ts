import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProductStock as PrismaProductStock } from '@prisma/client';
import { ProductStock } from '../domain/entity/product-stock.entity';
import { IStockRepository } from '../domain/interface/stock.repository.interface';

@Injectable()
export class StockRepository implements IStockRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaProductStock): ProductStock {
    return new ProductStock({
      productId: row.productId,
      quantity: row.quantity,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    });
  }

  // write: Entity → DB
  private fromDomain(stock: ProductStock) {
    return {
      productId: stock.productId,
      quantity: stock.quantity,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
      version: stock.version,
    };
  }

  async findByProductId(productId: string): Promise<ProductStock | null> {
    const stock = await this.prisma.productStock.findUnique({
      where: { productId },
    });

    return stock ? this.toDomain(stock) : null;
  }

  async create(stock: ProductStock): Promise<ProductStock> {
    const data = this.fromDomain(stock);

    const created = await this.prisma.productStock.create({
      data,
    });

    return this.toDomain(created);
  }

  // 낙관적 락을 사용한 재고 증가
  async increaseWithVersion(
    productId: string,
    quantity: number,
    currentVersion: number,
  ): Promise<void> {
    const result = await this.prisma.productStock.updateMany({
      where: {
        productId,
        version: currentVersion, // Optimistic Lock: 현재 버전과 일치해야 성공
      },
      data: {
        quantity: {
          increment: quantity,
        },
        version: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      throw new Error(
        '재고 증가 실패: 다른 트랜잭션에 의해 변경되었습니다. 다시 시도해주세요.',
      );
    }
  }

  // 낙관적 락을 사용한 재고 감소
  async decreaseWithVersion(
    productId: string,
    quantity: number,
    currentVersion: number,
  ): Promise<void> {
    const result = await this.prisma.productStock.updateMany({
      where: {
        productId,
        version: currentVersion, // Optimistic Lock: 현재 버전과 일치해야 성공
        quantity: {
          gte: quantity, // 재고 충분 여부 확인
        },
      },
      data: {
        quantity: {
          decrement: quantity,
        },
        version: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      throw new Error(
        '재고 감소 실패: 재고가 부족하거나 다른 트랜잭션에 의해 변경되었습니다.',
      );
    }
  }

  async getQuantity(productId: string): Promise<number> {
    const stock = await this.prisma.productStock.findUnique({
      where: { productId },
      select: { quantity: true },
    });

    return stock?.quantity ?? 0;
  }

  async exists(productId: string): Promise<boolean> {
    const count = await this.prisma.productStock.count({
      where: { productId },
    });

    return count > 0;
  }
}
