import { Controller, Get, Param } from '@nestjs/common';
import { UserInfo } from '@/user/decorators/user-info.decorator';
import { Public } from '@/auth/decorators/public.decorator';
import { Payload } from '@/types/express';
import { ProductCustomerService } from '../service/product-customer.service';

@Controller('product')
export class ProductCustomerController {
  constructor(
    private readonly productCustomerService: ProductCustomerService,
  ) {}

  @Get()
  @Public()
  findAll(@UserInfo() user: Payload | undefined) {
    return this.productCustomerService.findAll(user);
  }

  @Get(':id')
  findOne(@UserInfo() user: Payload | undefined, @Param('id') id: string) {
    return this.productCustomerService.findOne(user, id);
  }
}
