import { Point } from './point.entity';

describe('Point Policy', () => {
  describe('충전 금액은 0보다 커야 함', () => {
    it('양수로 포인트를 충전할 수 있다', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(() => point.charge(1000)).not.toThrow();
      expect(() => point.charge(1)).not.toThrow();
    });

    it('0으로 포인트를 충전할 수 없다', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(() => point.charge(0)).toThrow('충전 금액은 0보다 커야 합니다.');
    });

    it('음수로 포인트를 충전할 수 없다', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(() => point.charge(-100)).toThrow(
        '충전 금액은 0보다 커야 합니다.',
      );
    });
  });

  describe('사용 금액은 0보다 커야 함', () => {
    it('양수로 포인트를 사용할 수 있다', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);

      // When & Then
      expect(() => point.use(500)).not.toThrow();
      expect(() => point.use(1)).not.toThrow();
    });

    it('0으로 포인트를 사용할 수 없다', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);

      // When & Then
      expect(() => point.use(0)).toThrow('사용 금액은 0보다 커야 합니다.');
    });

    it('음수로 포인트를 사용할 수 없다', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);

      // When & Then
      expect(() => point.use(-100)).toThrow('사용 금액은 0보다 커야 합니다.');
    });
  });

  describe('환불 금액은 0보다 커야 함', () => {
    it('양수로 포인트를 환불할 수 있다', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(() => point.refund(500)).not.toThrow();
      expect(() => point.refund(1)).not.toThrow();
    });

    it('0으로 포인트를 환불할 수 없다', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(() => point.refund(0)).toThrow('환불 금액은 0보다 커야 합니다.');
    });

    it('음수로 포인트를 환불할 수 없다', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(() => point.refund(-100)).toThrow(
        '환불 금액은 0보다 커야 합니다.',
      );
    });
  });

  describe('잔액 부족 검증', () => {
    it('현재 잔액보다 많은 포인트를 사용할 수 없다', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);

      // When & Then
      expect(() => point.use(1500)).toThrow('포인트 잔액이 부족합니다');
    });

    it('현재 잔액과 같은 포인트까지 사용할 수 있다', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);

      // When
      point.use(1000);

      // Then
      expect(point.amount).toBe(0);
    });

    it('잔액이 0일 때는 포인트를 사용할 수 없다', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(() => point.use(1)).toThrow('포인트 잔액이 부족합니다');
    });
  });

  describe('잔액 확인 정책', () => {
    it('요청 금액만큼 잔액이 있으면 hasSufficientBalance가 true', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);

      // When & Then
      expect(point.hasSufficientBalance(500)).toBe(true);
      expect(point.hasSufficientBalance(1000)).toBe(true);
    });

    it('요청 금액보다 잔액이 적으면 hasSufficientBalance가 false', () => {
      // Given
      const point = Point.create('user-1');
      point.charge(1000);

      // When & Then
      expect(point.hasSufficientBalance(1500)).toBe(false);
    });

    it('잔액이 0일 때 0보다 큰 금액에 대해 hasSufficientBalance가 false', () => {
      // Given
      const point = Point.create('user-1');

      // When & Then
      expect(point.hasSufficientBalance(1)).toBe(false);
    });
  });
});
