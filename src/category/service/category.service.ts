import { PrismaService } from '@/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 카테고리 생성
   */
  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: dto,
    });
  }

  /**
   * 활성화된 카테고리 목록
   */
  async findActive() {
    return this.prisma.category.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * 전체 카테고리 목록
   */
  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * 카테고리 수정
   */
  async update(id: number, dto: UpdateCategoryDto) {
    // 1. 존재하는 카테고리인지 확인
    const exists = await this.prisma.category.count({
      where: { id },
    });

    // 2. 존재하지 않는다면 에러 반환
    if (!exists) {
      throw new NotFoundException(`ID ${id}인 카테고리를 찾을 수 없습니다.`);
    }

    // 3. 카테고리 수정 후 반환
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }
}
