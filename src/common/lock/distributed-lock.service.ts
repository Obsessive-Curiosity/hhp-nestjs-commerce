import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';
import { RedisService } from '../cache/redis.service';
import {
  LockAcquisitionException,
  LockWaitTimeoutException,
  LockSubscribeException,
} from './exceptions';

export interface Lock {
  key: string; // 락 키 (예: lock:stock:product-123)
  value: string; // UUID (소유자 식별용)
  ttl: number; // TTL (ms)
}

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly DEFAULT_TTL = 5000; // 5초
  private readonly DEFAULT_TIMEOUT = 10000; // 10초

  constructor(private readonly redisService: RedisService) {}

  /**
   * 락 획득 (Pub/Sub 대기 포함)
   *
   * 작동 방식:
   * 1. 즉시 락 획득 시도
   * 2. 성공하면 바로 반환
   * 3. 실패하면 Pub/Sub 채널 구독하고 대기
   * 4. 락 해제 메시지 받으면 다시 시도
   * 5. 타임아웃까지 반복
   */
  async acquire(
    lockKey: string,
    ttl: number = this.DEFAULT_TTL,
    timeout: number = this.DEFAULT_TIMEOUT,
  ): Promise<Lock> {
    const lockValue = randomUUID(); // 소유자 식별용 UUID
    const startTime = Date.now(); // 시작 시간 기록

    this.logger.log(`락 획득 시도 중: ${lockKey}`);

    // 1차 시도: 즉시 락 획득 시도
    const acquired = await this.tryAcquire(lockKey, lockValue, ttl);
    if (acquired) {
      this.logger.log(`락 즉시 획득 완료: ${lockKey}`);
      return { key: lockKey, value: lockValue, ttl };
    }

    // 실패 시 Pub/Sub으로 대기
    this.logger.log(`락이 사용 중입니다. 해제 채널 구독 중: ${lockKey}`);

    // 재시도 루프 (timeout 이전 까지)
    while (Date.now() - startTime < timeout) {
      try {
        // 락 해제 대기 (Pub/Sub 구독)
        await this.waitForRelease(lockKey, timeout - (Date.now() - startTime));

        // 메시지 받았으면 즉시 락 획득 시도
        const acquired = await this.tryAcquire(lockKey, lockValue, ttl);
        if (acquired) {
          const waitedTime = Date.now() - startTime;
          this.logger.log(
            `락 획득 완료 (대기 시간: ${waitedTime}ms): ${lockKey}`,
          );
          return { key: lockKey, value: lockValue, ttl };
        }

        // 실패하면 다시 대기 (다른 클라이언트가 먼저 가져감)
        this.logger.debug(`락 획득 실패, 재시도 중: ${lockKey}`);
      } catch (error: unknown) {
        this.logger.error(`락 해제 대기 중 오류 발생: ${lockKey}`, error);
        // 원래 에러를 그대로 전파 (에러 정보 보존)
        throw error;
      }
    }

    // 타임아웃 초과 (while 루프가 정상 종료된 경우)
    throw new LockAcquisitionException(lockKey);
  }

  /**
   * 락 해제 (Pub/Sub 알림 발행)
   *
   * 작동 방식:
   * 1. Lua 스크립트로 락 소유자 확인
   * 2. 내가 소유자면 락 삭제
   * 3. Pub/Sub 채널에 "released" 메시지 발행
   * 4. 대기 중인 모든 클라이언트가 메시지 수신
   */
  async release(lock: Lock): Promise<void> {
    const redis = this.redisService.getCacheClient();
    const channelKey = `${lock.key}:released`;

    // Lua 스크립트: 원자적으로 락 삭제 + 메시지 발행
    // 왜 Lua 스크립트? Redis는 단일 스레드라 Lua 스크립트는 원자적으로 실행됨
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        redis.call("del", KEYS[1])
        redis.call("publish", KEYS[2], "released")
        return 1
      else
        return 0
      end
    `;

    const result = await redis.eval(
      script,
      2, // KEYS 개수
      lock.key, // KEYS[1]: 락 키
      channelKey, // KEYS[2]: 채널 키
      lock.value, // ARGV[1]: 락 값 (UUID)
    );

    if (result === 1) {
      this.logger.log(`락 해제 및 알림 발행 완료: ${lock.key}`);
    } else {
      this.logger.warn(
        `락이 이미 만료되었거나 다른 클라이언트가 소유하고 있습니다: ${lock.key}`,
      );
    }
  }

  /**
   * 락 획득 시도 (즉시 반환)
   *
   * Redis SET NX 사용:
   * - NX: "Not eXists" - 키가 없을 때만 설정
   * - PX: TTL을 밀리초 단위로 설정
   *
   * 예: SET lock:stock:product-123 "uuid-123" PX 5000 NX
   * → 5초 후 자동 삭제됨 (작업이 5초 넘으면 자동 해제)
   */
  private async tryAcquire(
    lockKey: string,
    lockValue: string,
    ttl: number,
  ): Promise<boolean> {
    const redis = this.redisService.getCacheClient();

    const result = await redis.set(
      lockKey,
      lockValue,
      'PX', // TTL을 밀리초로 설정
      ttl,
      'NX', // 키가 없을 때만 설정
    );

    return result === 'OK';
  }

  /**
   * 락 해제 대기 (Pub/Sub 구독)
   *
   * 작동 방식:
   * 1. 새로운 Redis 연결 생성 (Pub/Sub은 blocking이라 별도 연결 필요)
   * 2. 채널 구독
   * 3. "released" 메시지 받으면 즉시 반환
   * 4. 타임아웃되면 에러 발생
   * 5. 반드시 구독 해제 및 연결 종료
   */
  private async waitForRelease(
    lockKey: string,
    timeout: number,
  ): Promise<void> {
    const channelKey = `${lockKey}:released`;

    return new Promise((resolve, reject) => {
      // 왜 duplicate()? Pub/Sub은 blocking 연결이라 다른 명령 실행 불가
      // 따라서 구독 전용 연결을 별도로 생성
      const subscriber = this.redisService.getCacheClient().duplicate();

      const timer = this.setupTimeoutHandler(
        subscriber,
        channelKey,
        lockKey,
        timeout,
        reject,
      ); // 타임아웃 핸들러 설정
      this.setupSubscription(subscriber, channelKey, timer, reject); // 구독 설정
      this.setupMessageHandler(subscriber, channelKey, timer, resolve); // 메시지 처리
    });
  }

  // 타임아웃 핸들러 설정
  private setupTimeoutHandler(
    subscriber: Redis,
    channelKey: string,
    lockKey: string,
    timeout: number,
    reject: (error: Error) => void,
  ): NodeJS.Timeout {
    return setTimeout(() => {
      this.cleanupSubscriber(subscriber, channelKey)
        .catch((error) => {
          this.logger.error('타임아웃 시 정리 작업 중 오류 발생', error);
        })
        .finally(() => {
          reject(new LockWaitTimeoutException(lockKey));
        });
    }, timeout);
  }

  /**
   * 채널 구독 설정
   */
  private setupSubscription(
    subscriber: Redis,
    channelKey: string,
    timer: NodeJS.Timeout,
    reject: (error: Error) => void,
  ): void {
    subscriber
      .subscribe(channelKey, (subscribeError: Error | null) => {
        if (subscribeError) {
          clearTimeout(timer); // 타임아웃 취소
          this.cleanupSubscriber(subscriber, channelKey) // 구독 취소 및 연결 종료
            .catch((cleanupError) => {
              this.logger.error(
                '채널 구독 실패 후 구독 취소 및 정리 작업 중 오류 발생',
                cleanupError,
              );
            })
            .finally(() => {
              reject(subscribeError); // 구독 오류 전달
            });
        }
      })
      .catch((subscribeErr: unknown) => {
        clearTimeout(timer);
        this.logger.error('구독 실패', subscribeErr);
        reject(
          subscribeErr instanceof Error
            ? subscribeErr
            : new LockSubscribeException(),
        );
      });
  }

  /**
   * 메시지 핸들러 설정
   */
  private setupMessageHandler(
    subscriber: Redis,
    channelKey: string,
    timer: NodeJS.Timeout,
    resolve: () => void,
  ): void {
    subscriber.on('message', (channel: string, message: string) => {
      if (channel === channelKey && message === 'released') {
        clearTimeout(timer); // 타임아웃 취소
        this.cleanupSubscriber(subscriber, channelKey)
          .catch((error) => {
            this.logger.error('메시지 처리 중 정리 작업 오류 발생', error);
          })
          .finally(() => {
            resolve(); // cleanup 성공/실패 무관하게 resolve
          });
      }
    });
  }

  /**
   * 채널 구독 취소 및 연결 종료
   */
  private async cleanupSubscriber(
    subscriber: Redis,
    channelKey: string,
  ): Promise<void> {
    await subscriber.unsubscribe(channelKey); // 채널 구독 취소
    await subscriber.quit(); // 연결 종료
  }
}
