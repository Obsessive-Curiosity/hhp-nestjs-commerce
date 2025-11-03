import { Module } from '@nestjs/common';
import { ProductCustomerService } from './service/product-customer.service';
import { ProductAdminController } from './controller/product-admin.controller';
import { ProductCustomerController } from './controller/product-customer.controller';
import { ProductAdminService } from './service/product-admin.service';

@Module({
  controllers: [ProductAdminController, ProductCustomerController],
  providers: [ProductCustomerService, ProductAdminService],
})
export class ProductModule {}
