import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePromotionsDto } from '../dto/create-promotion.dto';

@Injectable()
export class PromotionService {
  constructor(private readonly prisma: PrismaService) {}

  create(productId: string, dto: CreatePromotionsDto) {
    return this.prisma.productPromotion.createMany({
      data: dto.map((promotion) => ({
        productId,
        ...promotion,
      })),
    });
  }

  async delete(id: string) {
    const exist = await this.prisma.productPromotion.count({
      where: { id },
    });

    if (!exist) {
      throw new NotFoundException(`ID ${id}인 프로모션을 찾을 수 없습니다.`);
    }

    return this.prisma.productPromotion.delete({
      where: { id },
    });
  }
}
