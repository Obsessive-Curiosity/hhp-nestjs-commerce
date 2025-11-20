import { Controller, Get } from '@nestjs/common';
import { CategoryFacade } from '../../application/category.facade';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryFacade: CategoryFacade) {}

  /**
   * 활성화된 카테고리 목록 조회
   * GET /category/active
   */
  @Get('active')
  findActive() {
    return this.categoryFacade.getActiveCategories();
  }

  /**
   * 전체 카테고리 목록 조회
   * GET /category
   */
  @Get()
  findAll() {
    return this.categoryFacade.getAllCategories();
  }
}
