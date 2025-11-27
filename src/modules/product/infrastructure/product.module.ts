import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProductAdminController } from '../presentation/controller/product-admin.controller';
import { ProductCustomerController } from '../presentation/controller/product-customer.controller';
import { ProductService } from '../domain/service/product.service';
import { PromotionService } from '../domain/service/promotion.service';
import { StockService } from '../domain/service/stock.service';
import { ProductFacade } from '../application/product.facade';
import { CreateProductUsecase } from '../application/in-domain/create-product.usecase';
import { DeductStockTransaction } from '../application/in-domain/deduct-stock.transaction';
import { RestoreStockTransaction } from '../application/in-domain/restore-stock.transaction';
import { PRODUCT_REPOSITORY } from '../domain/interface/product.repository.interface';
import { PROMOTION_REPOSITORY } from '../domain/interface/promotion.repository.interface';
import { ProductRepository } from './product.repository';
import { PromotionRepository } from './promotion.repository';
import { StockRepository } from './stock.repository';
import { Product } from '../domain/entity/product.entity';
import { Stock } from '../domain/entity/stock.entity';
import { Promotion } from '../domain/entity/promotion.entity';
import { CategoryModule } from '@/modules/category/infrastructure/category.module';
import { LockModule } from '@/common/lock/lock.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([Product, Stock, Promotion]),
    CategoryModule,
  ],
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
    // Application Layer
    ProductFacade,
    CreateProductUsecase,
    // Transactions
    DeductStockTransaction,
    RestoreStockTransaction,
  ],
  exports: [
    ProductService,
    StockService,
    DeductStockTransaction,
    RestoreStockTransaction,
  ],
})
export class ProductModule {}
