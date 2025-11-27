export class LockWaitTimeoutException extends Error {
  constructor(lockKey: string) {
    super(`락 대기 시간 초과: ${lockKey}`);
    this.name = 'LockWaitTimeoutException';
  }
}
