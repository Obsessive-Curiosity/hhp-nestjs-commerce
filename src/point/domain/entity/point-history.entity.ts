export enum PointHistoryType {
  CHARGE = 'CHARGE', // 충전
  USE = 'USE', // 사용
  CANCEL = 'CANCEL', // 사용 취소 (환불)
}

export class PointHistory {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _orderId: string | null,
    private readonly _type: PointHistoryType,
    private readonly _amount: number,
    private readonly _balance: number,
    private readonly _createdAt: Date,
  ) {}

  static create(
    id: string,
    userId: string,
    type: PointHistoryType,
    amount: number,
    balance: number,
    orderId?: string,
  ): PointHistory {
    return new PointHistory(
      id,
      userId,
      orderId ?? null,
      type,
      amount,
      balance,
      new Date(),
    );
  }

  static from(
    id: string,
    userId: string,
    orderId: string | null,
    type: PointHistoryType,
    amount: number,
    balance: number,
    createdAt: Date,
  ): PointHistory {
    return new PointHistory(
      id,
      userId,
      orderId,
      type,
      amount,
      balance,
      createdAt,
    );
  }

  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get orderId(): string | null {
    return this._orderId;
  }

  get type(): PointHistoryType {
    return this._type;
  }

  get amount(): number {
    return this._amount;
  }

  get balance(): number {
    return this._balance;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
