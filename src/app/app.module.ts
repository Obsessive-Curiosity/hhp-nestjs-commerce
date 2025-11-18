import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@/config/config.module';
import { RedisModule } from '@/redis/redis.module';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user/infrastructure/user.module';
import { BearerTokenMiddleware } from '@/auth/middlewares/bearer-token.middleware';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { CategoryModule } from '@/category/infrastructure/category.module';
import { RbacGuard } from '@/auth/guards/rbac.guard';
import { ProductModule } from '@/product/infrastructure/product.module';
import { CartModule } from '@/cart/infrastructure/cart.module';
import { CouponModule } from '@/coupon/infrastructure/coupon.module';
import { WalletModule } from '@/wallet/infrastructure/wallet.module';
import { OrderModule } from '@/order/infrastructure/order.module';
import { MikroOrmModule } from '@/mikro-orm/mikro-orm.module';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    MikroOrmModule,
    JwtModule.register({ global: true }),
    AuthModule,
    UserModule,
    CategoryModule,
    ProductModule,
    CouponModule,
    CartModule,
    WalletModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BearerTokenMiddleware)
      .exclude(
        { path: '/auth/register', method: RequestMethod.POST },
        { path: '/auth/login', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
