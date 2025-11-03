import { Controller, Get, Param } from '@nestjs/common';
import { UserInfo } from '@/user/decorators/user-info.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { Payload } from '@/types/express';
import { ProductAdminService } from '../service/product-admin.service';

@Controller('/admin/product')
export class ProductAdminController {
  constructor(private readonly productAdminService: ProductAdminService) {}

  @Get()
  @Public()
  findAll(@UserInfo() user: Payload | undefined) {
    return this.productAdminService.findAll(user);
  }

  @Get(':id')
  findOne(@UserInfo() user: Payload | undefined, @Param('id') id: string) {
    return this.productAdminService.findOne(user, id);
  }
}
