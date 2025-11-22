import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { ProductModule } from '../../product/infrastructure/product.module';
import { CartService } from '../domain/service/cart.service';
import { CART_REPOSITORY } from '../domain/interface/cart.repository.interface';
import { CartRepository } from './cart.repository';
import { CartFacade } from '../application/cart.facade';
import { CartController } from '../presentation/controller/cart.controller';
import { CartUseCase } from '../application/cart.usecase';

@Module({
  imports: [RedisModule, ProductModule],
  controllers: [CartController],
  providers: [
    CartService,
    CartFacade,
    CartUseCase,
    {
      provide: CART_REPOSITORY,
      useClass: CartRepository,
    },
  ],
  exports: [CartService],
})
export class CartModule {}
