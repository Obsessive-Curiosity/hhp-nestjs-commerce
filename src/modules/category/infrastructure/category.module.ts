import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CategoryController } from '../presentation/controller/category.controller';
import { CategoryAdminController } from '../presentation/controller/category-admin.controller';
import { CategoryService } from '../domain/service/category.service';
import { CategoryFacade } from '../application/category.facade';
import { CategoryRepository } from './category.repository';
import { CATEGORY_REPOSITORY } from '../domain/interface/category.repository.interface';
import { Category } from '../domain/entity/category.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Category])],
  controllers: [CategoryController, CategoryAdminController],
  providers: [
    CategoryFacade,
    CategoryService,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}
