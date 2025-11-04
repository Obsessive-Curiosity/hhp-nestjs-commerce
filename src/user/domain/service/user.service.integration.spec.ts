import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interface/user.repository.interface';
import { User } from '../entity/user.entity';
import { PasswordService } from './password.service';

describe('UserService Integration Tests', () => {
  let service: UserService;
  let passwordService: PasswordService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    // Mock Repository 생성
    mockRepository = {
      existsById: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: mockRepository,
        },
        PasswordService, // 실제 PasswordService 사용
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    passwordService = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserInfo - 비밀번호 업데이트', () => {
    it('비밀번호를 함께 업데이트할 때 실제로 해싱이 이루어진다', async () => {
      // Given
      const userId = 'test-user-id';
      const plainPassword = 'newPassword123';
      const oldHashedPassword = await passwordService.hash('oldPassword');

      const user = User.create({
        id: userId,
        email: 'test@example.com',
        password: oldHashedPassword,
        name: '홍길동',
        phone: '010-1234-5678',
      });

      mockRepository.findById.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue(user);

      // When
      await service.updateUserInfo(userId, {
        name: '홍길동',
        phone: '010-1234-5678',
        password: plainPassword,
      });

      // Then
      expect(mockRepository.update).toHaveBeenCalled();
      const updatedUser = mockRepository.update.mock.calls[0][0];

      // 해시된 비밀번호가 실제로 검증 가능한지 확인 (실제 bcrypt 동작 검증)
      const isValid = await passwordService.verify(
        plainPassword,
        updatedUser.password,
      );
      expect(isValid).toBe(true);

      // 이전 비밀번호로는 검증되지 않는지 확인
      const isOldPasswordValid = await passwordService.verify(
        'oldPassword',
        updatedUser.password,
      );
      expect(isOldPasswordValid).toBe(false);
    });

    it('비밀번호 없이 업데이트하면 기존 비밀번호가 유지된다', async () => {
      // Given
      const userId = 'test-user-id';
      const originalPassword = await passwordService.hash('originalPassword');

      const user = User.create({
        id: userId,
        email: 'test@example.com',
        password: originalPassword,
        name: '홍길동',
        phone: '010-1234-5678',
      });

      mockRepository.findById.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue(user);

      // When
      await service.updateUserInfo(userId, {
        name: '김철수',
        phone: '010-9999-8888',
      });

      // Then
      expect(mockRepository.update).toHaveBeenCalled();
      const [[updatedUser]] = mockRepository.update.mock.calls;

      // 비밀번호가 변경되지 않았는지 확인
      expect(updatedUser.password).toBe(originalPassword);

      // 원래 비밀번호로 검증 가능한지 확인
      const isValid = await passwordService.verify(
        'originalPassword',
        updatedUser.password,
      );
      expect(isValid).toBe(true);
    });
  });
});
