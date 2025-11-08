import { Point } from './point.entity';

describe('Point Entity', () => {
  describe('create', () => {
    it('새로운 포인트 엔티티를 생성한다', () => {
      // Given
      const userId = 'user-1';

      // When
      const point = Point.create(userId);

      // Then
      expect(point.userId).toBe(userId);
      expect(point.amount).toBe(0);
      expect(point.version).toBe(0);
      expect(point.createdAt).toBeInstanceOf(Date);
      expect(point.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('from', () => {
    it('기존 데이터로부터 포인트 엔티티를 복원한다', () => {
      // Given
      const userId = 'user-1';
      const amount = 1000;
      const version = 5;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      // When
      const point = Point.from(userId, amount, version, createdAt, updatedAt);

      // Then
      expect(point.userId).toBe(userId);
      expect(point.amount).toBe(amount);
      expect(point.version).toBe(version);
      expect(point.createdAt).toBe(createdAt);
      expect(point.updatedAt).toBe(updatedAt);
    });
  });

  describe('charge', () => {
    it('포인트를 충전하면 금액이 증가하고 버전이 올라간다', () => {
      // Given
      const point = Point.create('user-1');
      const chargeAmount = 1000;
      const beforeVersion = point.version;

      // When
      point.charge(chargeAmount);

      // Then
      expect(point.amount).toBe(chargeAmount);
      expect(point.version).toBe(beforeVersion + 1);
    });

    it('포인트를 여러 번 충전하면 금액이 누적된다', () => {
      // Given
      const point = Point.create('user-1');

      // When
      point.charge(1000);
      point.charge(500);
      point.charge(300);

      // Then
      expect(point.amount).toBe(1800);
      expect(point.version).toBe(3);
    });

    it('충전 시 updatedAt이 갱신된다', () => {
      // Given
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01'));

      const point = Point.create('user-1');
      const beforeUpdate = point.updatedAt;

      // 시간차를 보장하기 위한 대기
      jest.setSystemTime(new Date('2024-01-02'));

      // When
      point.charge(1000);

      // Then
      expect(point.updatedAt).not.toEqual(beforeUpdate);
      expect(point.updatedAt.getTime()).toBeGreaterThan(beforeUpdate.getTime());

      jest.useRealTimers();
    });
  });

  describe('use', () => {
    it('포인트를 사용하면 금액이 감소하고 버전이 올라간다', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);
      const beforeAmount = point.amount;
      const beforeVersion = point.version;

      // When
      point.use(300);

      // Then
      expect(point.amount).toBe(beforeAmount - 300);
      expect(point.version).toBe(beforeVersion + 1);
    });

    it('사용 시 updatedAt이 갱신된다', () => {
      // Given
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01'));

      const point = Point.create('user-1');
      point.charge(1000);
      const beforeUpdate = point.updatedAt;

      jest.setSystemTime(new Date('2024-01-02'));

      // When
      point.use(500);

      // Then
      expect(point.updatedAt).not.toEqual(beforeUpdate);
      expect(point.updatedAt.getTime()).toBeGreaterThan(beforeUpdate.getTime());

      jest.useRealTimers();
    });
  });

  describe('refund', () => {
    it('포인트를 환불하면 금액이 증가하고 버전이 올라간다', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);
      point.use(300);
      const beforeAmount = point.amount;
      const beforeVersion = point.version;

      // When
      point.refund(300);

      // Then
      expect(point.amount).toBe(beforeAmount + 300);
      expect(point.version).toBe(beforeVersion + 1);
    });

    it('환불 시 updatedAt이 갱신된다', () => {
      // Given
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01'));

      const point = Point.create('user-1');
      const beforeUpdate = point.updatedAt;

      jest.setSystemTime(new Date('2024-01-02'));

      // When
      point.refund(500);

      // Then
      expect(point.updatedAt).not.toEqual(beforeUpdate);
      expect(point.updatedAt.getTime()).toBeGreaterThan(beforeUpdate.getTime());

      jest.useRealTimers();
    });
  });
});
