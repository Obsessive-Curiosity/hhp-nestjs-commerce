import { Logger } from '@nestjs/common';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import Redis from 'ioredis';

const logger = new Logger('TestRedisSetup');

export interface TestRedis {
  redis: Redis;
  container: StartedRedisContainer;
}

/**
 * TestContainers를 사용한 Redis 테스트 환경 설정
 *
 * @returns TestRedis - Redis 클라이언트와 컨테이너
 */
export async function setupTestRedis(): Promise<TestRedis> {
  // 1. Redis 컨테이너 시작
  logger.log('Starting Redis container...');
  const container = await new RedisContainer('redis:7.2').start();

  logger.log(`Redis container started at ${container.getConnectionUrl()}`);

  // 2. Redis 클라이언트 생성 (ioredis는 URL 연결 지원)
  const redis = new Redis(container.getConnectionUrl(), {
    maxRetriesPerRequest: null, // Bull/BullMQ 호환성을 위해 설정
  });

  logger.log('Test Redis setup complete!');

  return { redis, container };
}

/**
 * 테스트 Redis 정리
 *
 * @param testRedis - setupTestRedis()로 생성된 TestRedis
 */
export async function cleanupTestRedis(testRedis: TestRedis): Promise<void> {
  logger.log('Cleaning up test Redis...');

  // Redis 연결 강제 종료 (quit보다 빠르고 확실함)
  testRedis.redis.disconnect();

  // 컨테이너 중지
  await testRedis.container.stop();

  logger.log('Test Redis cleanup complete!');
}
