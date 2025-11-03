import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@prisma/client';
import { Public } from '@/auth/decorators/public.decorator';
import { UpdateCategoryDto } from './dto/update-category.dto';

@RBAC([Role.ADMIN])
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get('active')
  @Public()
  findActive() {
    return this.categoryService.findActive();
  }

  @Get()
  @Public()
  findAll() {
    return this.categoryService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }
}
