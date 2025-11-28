import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@/config/config.module';
import { RedisModule } from '@/common/cache/redis.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/infrastructure/user.module';
import { BearerTokenMiddleware } from '@/modules/auth/middlewares/bearer-token.middleware';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { CategoryModule } from '@/modules/category/infrastructure/category.module';
import { RbacGuard } from '@/modules/auth/guards/rbac.guard';
import { ProductModule } from '@/modules/product/infrastructure/product.module';
import { CartModule } from '@/modules/cart/infrastructure/cart.module';
import { CouponModule } from '@/modules/coupon/infrastructure/coupon.module';
import { WalletModule } from '@/modules/wallet/infrastructure/wallet.module';
import { OrderModule } from '@/modules/order/infrastructure/order.module';
import { MikroOrmModule } from '@/common/database/mikro-orm.module';

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
