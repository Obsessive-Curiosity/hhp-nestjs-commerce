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
import { WalletModule } from '@/wallet/infrastructure/wallet.module';
import { CartModule } from '@/cart/infrastructure/cart.module';
import { UserModule } from '@/user/infrastructure/user.module';
// Use Cases
import { CreateOrderUseCase } from '../application/cross-domain/create-order.usecase';
import { ProcessPaymentUseCase } from '../application/cross-domain/process-payment.usecase';
import { CancelOrderUseCase } from '../application/cross-domain/cancel-order.usecase';

@Module({
  imports: [
    ProductModule, // ProductService, StockService
    WalletModule,  // WalletService
    CartModule,    // CartService
    UserModule,    // UserService, AddressService
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
