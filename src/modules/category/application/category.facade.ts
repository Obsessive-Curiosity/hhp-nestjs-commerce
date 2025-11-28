import { Injectable } from '@nestjs/common';
import { CategoryService } from '../domain/service/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../presentation/dto';
import { Category } from '../domain/entity/category.entity';

@Injectable()
export class CategoryFacade {
  constructor(private readonly categoryService: CategoryService) {}

  // ==================== 조회 ====================

  // ID로 카테고리 조회
  async getCategoryById(id: number): Promise<Category> {
    return await this.categoryService.getCategoryById(id);
  }

  // 활성화된 카테고리 목록 조회
  async getActiveCategories(): Promise<Category[]> {
    return await this.categoryService.findActive();
  }

  // 전체 카테고리 목록 조회
  async getAllCategories(): Promise<Category[]> {
    return await this.categoryService.findAll();
  }

  // ==================== 생성 ====================

  // 카테고리 생성
  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    return await this.categoryService.create(dto);
  }

  // ==================== 수정 ====================

  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<Category> {
    return await this.categoryService.update(id, dto);
  }
}
