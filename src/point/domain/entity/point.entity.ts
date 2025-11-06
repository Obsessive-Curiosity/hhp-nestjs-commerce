export class Point {
  private constructor(
    private readonly _userId: string,
    private _amount: number,
    private _version: number,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(userId: string): Point {
    return new Point(userId, 0, 0, new Date(), new Date());
  }

  static from(
    userId: string,
    amount: number,
    version: number,
    createdAt: Date,
    updatedAt: Date,
  ): Point {
    return new Point(userId, amount, version, createdAt, updatedAt);
  }

  get userId(): string {
    return this._userId;
  }

  get amount(): number {
    return this._amount;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // 포인트 충전
  charge(amount: number): void {
    if (amount <= 0) {
      throw new Error('충전 금액은 0보다 커야 합니다.');
    }

    this._amount += amount;
    this._version += 1;
    this._updatedAt = new Date();
  }

  // 포인트 사용
  use(amount: number): void {
    if (amount <= 0) {
      throw new Error('사용 금액은 0보다 커야 합니다.');
    }

    if (this._amount < amount) {
      throw new Error(
        `포인트 잔액이 부족합니다. (잔액: ${this._amount}, 사용 요청: ${amount})`,
      );
    }

    this._amount -= amount;
    this._version += 1;
    this._updatedAt = new Date();
  }

  // 포인트 환불 (주문 취소 시)
  refund(amount: number): void {
    if (amount <= 0) {
      throw new Error('환불 금액은 0보다 커야 합니다.');
    }

    this._amount += amount;
    this._version += 1;
    this._updatedAt = new Date();
  }

  // 잔액이 충분한지 확인
  hasSufficientBalance(amount: number): boolean {
    return this._amount >= amount;
  }
}
