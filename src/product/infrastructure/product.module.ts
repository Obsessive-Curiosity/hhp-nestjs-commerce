import { Module } from '@nestjs/common';
import { ProductAdminController } from '../presentation/controller/product-admin.controller';
import { ProductCustomerController } from '../presentation/controller/product-customer.controller';
import { ProductService } from '../domain/service/product.service';
import { PromotionService } from '../domain/service/promotion.service';
import { StockService } from '../domain/service/stock.service';
import { ProductFacadeService } from '../application/product.facade';
import { PRODUCT_REPOSITORY } from '../domain/interface/product.repository.interface';
import { PROMOTION_REPOSITORY } from '../domain/interface/promotion.repository.interface';
import { STOCK_REPOSITORY } from '../domain/interface/stock.repository.interface';
import { ProductRepository } from './product.repository';
import { PromotionRepository } from './promotion.repository';
import { StockRepository } from './stock.repository';

@Module({
  controllers: [ProductAdminController, ProductCustomerController],
  providers: [
    // Repository 의존성 주입
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
    {
      provide: PROMOTION_REPOSITORY,
      useClass: PromotionRepository,
    },
    {
      provide: STOCK_REPOSITORY,
      useClass: StockRepository,
    },
    // Domain Services
    ProductService,
    PromotionService,
    StockService,
    // Application Facade
    ProductFacadeService,
  ],
  exports: [ProductFacadeService, StockService],
})
export class ProductModule {}
