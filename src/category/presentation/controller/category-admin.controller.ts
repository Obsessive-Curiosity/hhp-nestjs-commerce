import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryFacade } from '../../application/category.facade';
import { Role } from '@/user/domain/entity/user.entity';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';

@RBAC([Role.ADMIN])
@Controller('/admin/category')
export class CategoryAdminController {
  constructor(private readonly categoryFacade: CategoryFacade) {}

  /**
   * 카테고리 생성
   * POST /admin/category
   */
  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryFacade.createCategory(createCategoryDto);
  }

  /**
   * 카테고리 수정
   * PATCH /admin/category/:id
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryFacade.updateCategory(id, updateCategoryDto);
  }
}
