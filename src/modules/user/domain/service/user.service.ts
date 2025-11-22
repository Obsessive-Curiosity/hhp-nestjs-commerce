import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { User } from '../entity/user.entity';
import { CreateUserProps, UpdateUserProps } from '../types';
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

  // ==================== 조회 (Query) ====================

  // ID로 사용자 조회
  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  // 이메일로 사용자 존재 여부 확인
  async existsUser(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return !!user;
  }

  // 사용자 인증 (이메일 + 비밀번호)
  async authenticateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.isDeleted()) {
      throw new BadRequestException('잘못된 로그인 정보 입니다!');
    }

    // 비밀번호 검증
    const passOK = await this.passwordService.verify(password, user.password);

    if (!passOK) {
      throw new BadRequestException('잘못된 로그인 정보 입니다!');
    }

    return user;
  }

  // ==================== 생성 (Create) ====================

  // 사용자 생성
  async createUser(props: CreateUserProps): Promise<User> {
    const { role, email, password, name, phone, companyPhone } = props;

    // 1. 이메일 중복 체크
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 2. 비밀번호 해싱
    const hashedPassword = await this.passwordService.hash(password);

    // 3. 사용자 엔티티 생성
    const user = User.create({
      role,
      email,
      password: hashedPassword,
      name,
      personalPhone: { number: phone },
      companyPhone: companyPhone ? { number: companyPhone } : undefined,
    });

    // 4. 저장
    const createdUser = await this.userRepository.create(user);
    return createdUser;
  }

  // ==================== 수정 (Update) ====================

  // 로그인 기록
  async recordLogin(userId: string): Promise<void> {
    if (!userId) return;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    user.recordLogin();
    await this.userRepository.update(user);
  }

  // 사용자 정보 수정
  async updateUser(userId: string, props: UpdateUserProps): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const { name, personalPhone, companyPhone, currentPassword, newPassword } =
      props;

    if (name || personalPhone || companyPhone) {
      user.updateInfo({ name, personalPhone, companyPhone });
    }

    if (newPassword && currentPassword) {
      // 1. 현재 비밀번호 검증
      const isCurrentPasswordValid = await this.passwordService.verify(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new BadRequestException('현재 비밀번호가 일치하지 않습니다.');
      }

      // 2. 새 비밀번호 해싱
      const hashedPassword = await this.passwordService.hash(newPassword);

      // 3. 비밀번호 업데이트
      user.updatePassword(hashedPassword);
    }

    return await this.userRepository.update(user);
  }

  // ==================== 삭제 (Delete) ====================

  // 사용자 삭제 (Soft Delete)
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.isDeleted()) {
      throw new ConflictException('이미 삭제된 사용자입니다.');
    }

    await this.userRepository.softDelete(userId);
  }
}
