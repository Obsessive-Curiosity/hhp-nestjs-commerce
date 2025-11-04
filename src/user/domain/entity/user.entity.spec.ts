import { User, Role } from './user.entity';

describe('User Entity', () => {
  describe('create', () => {
    it('신규 사용자를 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: '홍길동',
        phone: '010-1234-5678',
      };

      // When
      const user = User.create(params);

      // Then
      expect(user.id).toBe(params.id);
      expect(user.email).toBe(params.email);
      expect(user.name).toBe(params.name);
      expect(user.phone).toBe(params.phone);
      expect(user.role).toBe(Role.RETAILER); // 기본값
      expect(user.isDeleted()).toBe(false);
    });

    it('관리자 권한으로 사용자를 생성할 수 있다', () => {
      // Given
      const params = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        password: 'hashedPassword123',
        name: '관리자',
        phone: '010-1234-5678',
        role: Role.ADMIN,
      };

      // When
      const user = User.create(params);

      // Then
      expect(user.role).toBe(Role.ADMIN);
      expect(user.isAdmin()).toBe(true);
      expect(user.isRetailer()).toBe(false);
    });
  });

  describe('비즈니스 로직', () => {
    let user: User;

    beforeEach(() => {
      user = User.create({
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashedPassword123',
        name: '홍길동',
        phone: '010-1234-5678',
      });
    });

    describe('recordLogin', () => {
      it('로그인 시간을 기록할 수 있다', () => {
        // Given
        expect(user.lastLoginAt).toBeNull();

        // When
        user.recordLogin();

        // Then
        expect(user.lastLoginAt).toBeInstanceOf(Date);
      });
    });

    describe('updateInfo', () => {
      it('사용자 정보를 수정할 수 있다', () => {
        // Given
        const newName = '김철수';
        const newPhone = '010-9999-8888';

        // When
        user.updateInfo(newName, newPhone);

        // Then
        expect(user.name).toBe(newName);
        expect(user.phone).toBe(newPhone);
      });

      it('삭제된 사용자는 정보를 수정할 수 없다', () => {
        // Given
        user.delete();

        // When & Then
        expect(() => {
          user.updateInfo('새이름', '010-1111-2222');
        }).toThrow('삭제된 사용자는 정보를 수정할 수 없습니다.');
      });
    });

    describe('updatePassword', () => {
      it('비밀번호를 업데이트할 수 있다', () => {
        // Given
        const newHashedPassword = 'newHashedPassword456';

        // When
        user.updatePassword(newHashedPassword);

        // Then
        expect(user.password).toBe(newHashedPassword);
      });

      it('삭제된 사용자는 비밀번호를 변경할 수 없다', () => {
        // Given
        user.delete();

        // When & Then
        expect(() => {
          user.updatePassword('newPassword');
        }).toThrow('삭제된 사용자는 비밀번호를 변경할 수 없습니다.');
      });
    });

    describe('delete', () => {
      it('사용자를 삭제할 수 있다 (Soft Delete)', () => {
        // Given
        expect(user.isActive()).toBe(true);

        // When
        user.delete();

        // Then
        expect(user.isDeleted()).toBe(true);
        expect(user.isActive()).toBe(false);
        expect(user.deletedAt).toBeInstanceOf(Date);
      });

      it('이미 삭제된 사용자는 다시 삭제할 수 없다', () => {
        // Given
        user.delete();

        // When & Then
        expect(() => {
          user.delete();
        }).toThrow('이미 삭제된 사용자입니다.');
      });
    });

    describe('권한 확인', () => {
      it('RETAILER 권한을 확인할 수 있다', () => {
        // Given
        const retailer = User.create({
          id: 'retailer-id',
          email: 'retailer@example.com',
          password: 'password',
          name: '소비자',
          phone: '010-1111-2222',
          role: Role.RETAILER,
        });

        // Then
        expect(retailer.isRetailer()).toBe(true);
        expect(retailer.isWholesaler()).toBe(false);
        expect(retailer.isAdmin()).toBe(false);
      });

      it('WHOLESALER 권한을 확인할 수 있다', () => {
        // Given
        const wholesaler = User.create({
          id: 'wholesaler-id',
          email: 'wholesaler@example.com',
          password: 'password',
          name: '도매자',
          phone: '010-3333-4444',
          role: Role.WHOLESALER,
        });

        // Then
        expect(wholesaler.isWholesaler()).toBe(true);
        expect(wholesaler.isRetailer()).toBe(false);
        expect(wholesaler.isAdmin()).toBe(false);
      });

      it('ADMIN 권한을 확인할 수 있다', () => {
        // Given
        const admin = User.create({
          id: 'admin-id',
          email: 'admin@example.com',
          password: 'password',
          name: '관리자',
          phone: '010-5555-6666',
          role: Role.ADMIN,
        });

        // Then
        expect(admin.isAdmin()).toBe(true);
        expect(admin.isRetailer()).toBe(false);
        expect(admin.isWholesaler()).toBe(false);
      });
    });
  });
});
