import { Module } from '@nestjs/common';
import { OrderController } from '../presentation/controller/order.controller';
import { OrderAdminController } from '../presentation/controller/order-admin.controller';
import { OrderService } from '../domain/service/order.service';
import { OrderItemService } from '../domain/service/order-item.service';
import { OrderCalculationService } from '../domain/service/order-calculation.service';
import { OrderFacade } from '../application/order.facade';
import { ORDER_REPOSITORY } from '../domain/interface/order.repository.interface';
import { ORDER_ITEM_REPOSITORY } from '../domain/interface/order-item.repository.interface';
import { OrderRepository } from './order.repository';
import { OrderItemRepository } from './order-item.repository';
import { ProductModule } from '@/product/infrastructure/product.module';
import { PointModule } from '@/point/infrastructure/point.module';
import { CartModule } from '@/cart/infrastructure/cart.module';
import { PrismaModule } from '@/prisma/prisma.module';
// Use Cases
import { CreateOrderUseCase } from '../application/usecase/create-order.usecase';
import { ProcessPaymentUseCase } from '../application/usecase/process-payment.usecase';
import { CancelOrderUseCase } from '../application/usecase/cancel-order.usecase';

@Module({
  imports: [
    PrismaModule,
    ProductModule, // ProductService, StockService
    PointModule,   // PointService
    CartModule,    // CartService
  ],
  controllers: [OrderController, OrderAdminController],
  providers: [
    // Repository 의존성 주입
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
    {
      provide: ORDER_ITEM_REPOSITORY,
      useClass: OrderItemRepository,
    },
    // Domain Services
    OrderService,
    OrderItemService,
    OrderCalculationService,
    // Use Cases
    CreateOrderUseCase,
    ProcessPaymentUseCase,
    CancelOrderUseCase,
    // Application Facade
    OrderFacade,
  ],
  exports: [OrderService, OrderFacade],
})
export class OrderModule {}
