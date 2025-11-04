import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interface/user.repository.interface';
import { User } from '../entity/user.entity';
import { PasswordService } from './password.service';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;

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

    // Mock PasswordService 생성
    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: PasswordService,
          useValue: mockPasswordService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordLogin', () => {
    it('로그인 시간을 기록할 수 있다', async () => {
      // Given
      const userId = 'test-user-id';
      const user = User.create({
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: '홍길동',
        phone: '010-1234-5678',
      });

      mockRepository.findById.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue(user);

      // When
      await service.recordLogin(userId);

      // Then
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('사용자가 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const userId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.recordLogin(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserById', () => {
    it('사용자 ID로 조회할 수 있다', async () => {
      // Given
      const userId = 'test-user-id';
      const user = User.create({
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: '홍길동',
        phone: '010-1234-5678',
      });

      mockRepository.findById.mockResolvedValue(user);

      // When
      const result = await service.getUserById(userId);

      // Then
      expect(result).toBe(user);
      expect(mockRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('사용자가 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.getUserById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserInfo', () => {
    it('사용자 정보를 업데이트할 수 있다', async () => {
      // Given
      const userId = 'test-user-id';
      const user = User.create({
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: '홍길동',
        phone: '010-1234-5678',
      });

      mockRepository.findById.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue(user);

      const updateData = {
        name: '김철수',
        phone: '010-9999-8888',
      };

      // When
      const result = await service.updateUserInfo(userId, updateData);

      // Then
      expect(result.name).toBe(updateData.name);
      expect(result.phone).toBe(updateData.phone);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('사용자가 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(
        service.updateUserInfo('non-existent-id', {
          name: '새이름',
          phone: '010-1111-2222',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('사용자를 삭제할 수 있다', async () => {
      // Given
      const userId = 'test-user-id';
      const user = User.create({
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        name: '홍길동',
        phone: '010-1234-5678',
      });

      mockRepository.findById.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue(user);

      // When
      await service.deleteUser(userId);

      // Then
      expect(mockRepository.update).toHaveBeenCalled();
      const deletedUser = mockRepository.update.mock.calls[0][0];
      expect(deletedUser.isDeleted()).toBe(true);
    });

    it('사용자가 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(service.deleteUser('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isEmailDuplicated', () => {
    it('이메일 중복 여부를 확인할 수 있다', async () => {
      // Given
      const email = 'test@example.com';
      const user = User.create({
        id: 'test-user-id',
        email,
        password: 'hashedPassword',
        name: '홍길동',
        phone: '010-1234-5678',
      });

      mockRepository.findByEmail.mockResolvedValue(user);

      // When
      const result = await service.isEmailDuplicated(email);

      // Then
      expect(result).toBe(true);
      expect(mockRepository.findByEmail).toHaveBeenCalledWith(email);
    });

    it('중복되지 않은 이메일은 false를 반환한다', async () => {
      // Given
      mockRepository.findByEmail.mockResolvedValue(null);

      // When
      const result = await service.isEmailDuplicated('new@example.com');

      // Then
      expect(result).toBe(false);
    });
  });
});
