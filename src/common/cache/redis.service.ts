import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig } from './redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private cacheClient: Redis;

  onModuleInit() {
    this.cacheClient = new Redis(redisConfig.cache);
    this.cacheClient.on('connect', () => {
      this.logger.log('Cache Redis connected');
    });
    this.cacheClient.on('error', (err) => {
      this.logger.error('Cache Redis error:', err);
    });
  }

  async onModuleDestroy() {
    await this.cacheClient.quit();
  }

  getCacheClient(): Redis {
    return this.cacheClient;
  }
}
