export class LockAcquisitionException extends Error {
  constructor(lockKey: string) {
    super(`락 획득 실패: ${lockKey}`);
    this.name = 'LockAcquisitionException';
  }
}
