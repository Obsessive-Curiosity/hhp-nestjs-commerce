import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserInfo } from '@/modules/user/presentation/decorators/user-info.decorator';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Payload } from '@/common/types/express';
import { RBAC } from '@/modules/auth/decorators/rbac.decorator';
import { Role } from '@/modules/user/domain/entity/user.entity';
import { ProductFacade } from '@/modules/product/application/product.facade';
import { GetProductsQueryDto } from '../dto/get-products-query.dto';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('product')
export class ProductCustomerController {
  constructor(private readonly productFacade: ProductFacade) {}

  @Get()
  @Public()
  findAll(@Query() query: GetProductsQueryDto, @UserInfo() user?: Payload) {
    return this.productFacade.getProducts(
      { categoryId: query.categoryId },
      user,
    );
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string, @UserInfo() user?: Payload) {
    return this.productFacade.getProduct(id, user);
  }
}
