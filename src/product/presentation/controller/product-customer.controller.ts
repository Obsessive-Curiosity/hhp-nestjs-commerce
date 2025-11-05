import { Controller, Get, Param } from '@nestjs/common';
import { UserInfo } from '@/user/presentation/decorators/user-info.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { Payload } from '@/types/express';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@prisma/client';
import { ProductFacadeService } from '@/product/application/product.facade';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('product')
export class ProductCustomerController {
  constructor(private readonly productFacade: ProductFacadeService) {}

  @Get()
  @Public()
  findAll(@UserInfo() user?: Payload) {
    return this.productFacade.getProducts(user);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string, @UserInfo() user?: Payload) {
    return this.productFacade.getProduct(id, user);
  }
}
