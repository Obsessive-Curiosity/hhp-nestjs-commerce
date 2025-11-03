import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './service/category.service';
import { CategoryAdminController } from './controller/category-admin.controller';

@Module({
  controllers: [CategoryController, CategoryAdminController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
