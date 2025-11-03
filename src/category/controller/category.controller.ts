import { Controller, Get } from '@nestjs/common';
import { CategoryService } from '../service/category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('active')
  findActive() {
    return this.categoryService.findActive();
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }
}
