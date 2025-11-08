import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { UpdateUserDto } from '../../presentation/dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../interface/user.repository.interface';
import { PasswordService } from './password.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  // 로그인 기록 업데이트
  async recordLogin(userId: string): Promise<void> {
    if (!userId) return;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.recordLogin();
    await this.userRepository.update(user);
  }

  // 사용자 정보 조회
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  // 사용자 정보 업데이트
  async updateUserInfo(userId: string, data: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 기본 정보 업데이트 (name, phone이 있을 때만)
    if (data.name !== undefined || data.phone !== undefined) {
      user.updateInfo(data.name, data.phone);
    }

    // 비밀번호 업데이트
    if (data.password) {
      const hashedPassword = await this.passwordService.hash(data.password); // 비밀번호 해싱
      user.updatePassword(hashedPassword);
    }

    return await this.userRepository.update(user);
  }

  // 사용자 계정 삭제 (Soft Delete)
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.delete();
    await this.userRepository.update(user);
  }

  // 이메일 중복 확인
  async isEmailDuplicated(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return user !== null;
  }
}
