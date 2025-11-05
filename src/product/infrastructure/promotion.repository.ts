import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProductPromotion as PrismaPromotion } from '@prisma/client';
import { Promotion } from '../domain/entity/promotion.entity';
import {
  IPromotionRepository,
  CreatePromotionData,
} from '../domain/interface/promotion.repository.interface';
import { assignDirtyFields } from '@/common/utils/repository.utils';

@Injectable()
export class PromotionRepository implements IPromotionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaPromotion): Promotion {
    return new Promotion({
      id: row.id,
      productId: row.productId,
      paidQuantity: row.paidQuantity,
      freeQuantity: row.freeQuantity,
      startAt: row.startAt,
      endAt: row.endAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // write: Entity → DB
  private fromDomain(promotion: Promotion) {
    return {
      id: promotion.id,
      productId: promotion.productId,
      paidQuantity: promotion.paidQuantity,
      freeQuantity: promotion.freeQuantity,
      startAt: promotion.startAt,
      endAt: promotion.endAt,
      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }

  async findById(id: string): Promise<Promotion | null> {
    const promotion = await this.prisma.productPromotion.findUnique({
      where: { id },
    });

    return promotion ? this.toDomain(promotion) : null;
  }

  async findByProductId(productId: string): Promise<Promotion[]> {
    const promotions = await this.prisma.productPromotion.findMany({
      where: { productId },
      orderBy: { startAt: 'desc' },
    });

    return promotions.map((p) => this.toDomain(p));
  }

  async findActiveByProductId(
    productId: string,
    now: Date = new Date(),
  ): Promise<Promotion | null> {
    const promotion = await this.prisma.productPromotion.findFirst({
      where: {
        productId,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gte: now } }],
      },
      orderBy: { startAt: 'desc' },
    });

    return promotion ? this.toDomain(promotion) : null;
  }

  async existsByProductIdAndPaidQuantity(
    productId: string,
    paidQuantity: number,
  ): Promise<boolean> {
    const count = await this.prisma.productPromotion.count({
      where: {
        productId,
        paidQuantity,
      },
    });

    return count > 0;
  }

  async create(
    productId: string,
    promotionData: CreatePromotionData,
  ): Promise<Promotion> {
    const { paidQuantity, freeQuantity, startAt, endAt } = promotionData;
    const createdPromotion = await this.prisma.productPromotion.create({
      data: {
        productId,
        paidQuantity,
        freeQuantity,
        startAt: startAt ?? new Date(), // 없으면 현재 시간
        endAt: endAt ?? null,
      },
    });

    return this.toDomain(createdPromotion);
  }

  async createMany(
    productId: string,
    promotionsData: CreatePromotionData[],
  ): Promise<Promotion[]> {
    // Prisma createMany는 생성된 데이터를 반환하지 않으므로, 개별 create 사용
    const created = await Promise.all(
      promotionsData.map((data) => this.create(productId, data)),
    );

    return created;
  }

  async update(promotion: Promotion): Promise<Promotion> {
    const dirtyFields = promotion.getDirtyFields();

    // 변경된 필드가 없으면 스킵
    if (dirtyFields.size === 0) {
      return promotion;
    }

    // 변경된 필드만 추출
    const fullData = this.fromDomain(promotion);
    const updateData: Partial<ReturnType<typeof this.fromDomain>> = {};

    assignDirtyFields(fullData, updateData, [
      ...dirtyFields,
    ] as (keyof ReturnType<typeof this.fromDomain>)[]);

    const updatedPromotion = await this.prisma.productPromotion.update({
      where: { id: promotion.id },
      data: updateData,
    });

    const result = this.toDomain(updatedPromotion);
    result.clearDirtyFields();

    return result;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.productPromotion.delete({
      where: { id },
    });
  }

  async deleteByProductId(productId: string): Promise<void> {
    await this.prisma.productPromotion.deleteMany({
      where: { productId },
    });
  }
}
