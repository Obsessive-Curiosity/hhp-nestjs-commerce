import { PointHistory, PointHistoryType } from './point-history.entity';

describe('PointHistory Entity', () => {
  describe('create', () => {
    it('충전 이력을 생성한다', () => {
      // Given
      const id = 'history-1';
      const userId = 'user-1';
      const type = PointHistoryType.CHARGE;
      const amount = 1000;
      const balance = 1000;

      // When
      const history = PointHistory.create(id, userId, type, amount, balance);

      // Then
      expect(history.id).toBe(id);
      expect(history.userId).toBe(userId);
      expect(history.type).toBe(type);
      expect(history.amount).toBe(amount);
      expect(history.balance).toBe(balance);
      expect(history.orderId).toBeNull();
      expect(history.createdAt).toBeInstanceOf(Date);
    });

    it('사용 이력을 생성할 때 orderId를 포함한다', () => {
      // Given
      const id = 'history-1';
      const userId = 'user-1';
      const type = PointHistoryType.USE;
      const amount = -500;
      const balance = 500;
      const orderId = 'order-1';

      // When
      const history = PointHistory.create(
        id,
        userId,
        type,
        amount,
        balance,
        orderId,
      );

      // Then
      expect(history.id).toBe(id);
      expect(history.userId).toBe(userId);
      expect(history.type).toBe(type);
      expect(history.amount).toBe(amount);
      expect(history.balance).toBe(balance);
      expect(history.orderId).toBe(orderId);
      expect(history.createdAt).toBeInstanceOf(Date);
    });

    it('환불 이력을 생성할 때 orderId를 포함한다', () => {
      // Given
      const id = 'history-1';
      const userId = 'user-1';
      const type = PointHistoryType.CANCEL;
      const amount = 500;
      const balance = 1000;
      const orderId = 'order-1';

      // When
      const history = PointHistory.create(
        id,
        userId,
        type,
        amount,
        balance,
        orderId,
      );

      // Then
      expect(history.orderId).toBe(orderId);
      expect(history.type).toBe(type);
    });

    it('orderId가 없으면 null로 설정된다', () => {
      // Given
      const id = 'history-1';
      const userId = 'user-1';
      const type = PointHistoryType.CHARGE;
      const amount = 1000;
      const balance = 1000;

      // When
      const history = PointHistory.create(id, userId, type, amount, balance);

      // Then
      expect(history.orderId).toBeNull();
    });
  });

  describe('from', () => {
    it('기존 데이터로부터 포인트 이력 엔티티를 복원한다', () => {
      // Given
      const id = 'history-1';
      const userId = 'user-1';
      const orderId = 'order-1';
      const type = PointHistoryType.USE;
      const amount = -500;
      const balance = 500;
      const createdAt = new Date('2024-01-01');

      // When
      const history = PointHistory.from(
        id,
        userId,
        orderId,
        type,
        amount,
        balance,
        createdAt,
      );

      // Then
      expect(history.id).toBe(id);
      expect(history.userId).toBe(userId);
      expect(history.orderId).toBe(orderId);
      expect(history.type).toBe(type);
      expect(history.amount).toBe(amount);
      expect(history.balance).toBe(balance);
      expect(history.createdAt).toBe(createdAt);
    });

    it('orderId가 null인 이력을 복원한다', () => {
      // Given
      const id = 'history-1';
      const userId = 'user-1';
      const orderId = null;
      const type = PointHistoryType.CHARGE;
      const amount = 1000;
      const balance = 1000;
      const createdAt = new Date('2024-01-01');

      // When
      const history = PointHistory.from(
        id,
        userId,
        orderId,
        type,
        amount,
        balance,
        createdAt,
      );

      // Then
      expect(history.orderId).toBeNull();
    });
  });

  describe('PointHistoryType', () => {
    it('CHARGE, USE, CANCEL 타입이 정의되어 있다', () => {
      expect(PointHistoryType.CHARGE).toBe('CHARGE');
      expect(PointHistoryType.USE).toBe('USE');
      expect(PointHistoryType.CANCEL).toBe('CANCEL');
    });
  });

  describe('immutability', () => {
    it('생성된 이력은 변경할 수 없다', () => {
      // Given
      const history = PointHistory.create(
        'history-1',
        'user-1',
        PointHistoryType.CHARGE,
        1000,
        1000,
      );

      // When & Then
      // 모든 속성이 readonly이므로 컴파일 타임에 에러 발생
      // 런타임에서도 속성 변경 시도가 실패해야 함
      expect(() => {
        // @ts-expect-error - Testing immutability
        history.amount = 2000;
      }).toThrow();
    });
  });
});
