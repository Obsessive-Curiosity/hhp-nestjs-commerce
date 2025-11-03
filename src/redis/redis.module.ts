import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { redisConfig } from './redis.config';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        const keyvRedis = new KeyvRedis(
          `redis://${redisConfig.cache.host}:${redisConfig.cache.port}`,
        );
        const keyv = new Keyv({ store: keyvRedis, namespace: 'cache' });

        return { store: keyv };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
