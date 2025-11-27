import { Module } from '@nestjs/common';
import { RedisModule } from '../cache/redis.module';
import { DistributedLockService } from './distributed-lock.service';
import { DistributedLockManager } from './distributed-lock-manager.service';

@Module({
  imports: [RedisModule],
  providers: [DistributedLockService, DistributedLockManager],
  exports: [DistributedLockService, DistributedLockManager],
})
export class LockModule {}
