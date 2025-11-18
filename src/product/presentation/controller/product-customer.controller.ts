import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserInfo } from '@/user/presentation/decorators/user-info.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { Payload } from '@/types/express';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@/user/domain/entity/user.entity';
import { ProductFacade } from '@/product/application/product.facade';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('product')
export class ProductCustomerController {
  constructor(private readonly productFacade: ProductFacade) {}

  @Get()
  @Public()
  findAll(@Query() query: GetProductsQueryDto, @UserInfo() user?: Payload) {
    return this.productFacade.getProducts(
      {
        categoryId: query.categoryId,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        search: query.search,
      },
      user,
    );
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string, @UserInfo() user?: Payload) {
    return this.productFacade.getProduct(id, user);
  }
}
