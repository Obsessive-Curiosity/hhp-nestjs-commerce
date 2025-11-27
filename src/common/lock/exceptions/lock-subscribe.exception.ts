export class LockSubscribeException extends Error {
  constructor(message: string = '구독 실패') {
    super(message);
    this.name = 'LockSubscribeException';
  }
}
