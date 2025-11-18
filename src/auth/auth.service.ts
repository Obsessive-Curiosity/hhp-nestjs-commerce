import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { JwtConfigValidator } from '../config/validators/jwt-config.validator';
import { Payload } from '../types/express';
import { SignupDto } from './dto/signup.dto';
import { UserFacade } from '@/user/application/user.facade';
import { UserService } from '@/user/domain/service/user.service';
import { PasswordService } from '@/user/domain/service/password.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '@/user/domain/interface/user.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfigValidator,
    private readonly userFacade: UserFacade,
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
  ) {}

  // 회원가입
  async signup(dto: SignupDto) {
    // UserFacade에 위임 (사용자 생성 + 지갑 초기화)
    return await this.userFacade.createMyAccount(dto);
  }

  async login(user: Payload | undefined) {
    if (!user || !user.sub) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 마지막 로그인 시간 기록
    await this.userService.recordLogin(user.sub);

    // 토큰 발급
    return {
      accessToken: await this.issueToken(user, 'access'),
      refreshToken: await this.issueToken(user, 'refresh'),
    };
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.isDeleted()) {
      throw new BadRequestException('잘못된 로그인 정보 입니다!');
    }

    // 비밀번호 검증 (PasswordService 활용)
    const passOK = await this.passwordService.verify(password, user.password);

    if (!passOK) {
      throw new BadRequestException('잘못된 로그인 정보 입니다!');
    }

    return user;
  }

  async issueToken(
    payload: Payload,
    type: 'access' | 'refresh',
  ): Promise<string> {
    const { sub, role } = payload;
    const config = this.jwtConfig;
    const isRefreshToken = type === 'refresh';

    const secret = isRefreshToken
      ? config.refreshTokenSecret
      : config.accessTokenSecret;

    const expiresIn = isRefreshToken
      ? config.refreshTokenExpiresIn
      : config.accessTokenExpiresIn;

    const jwtPayload = { sub, role, type };
    const options = { secret, expiresIn };

    return this.jwtService.signAsync<Payload>(
      jwtPayload,
      options as unknown as JwtSignOptions,
    );
  }

  rotateAccessToken(refreshToken: string) {
    const payload = this.jwtService.decode<Payload>(refreshToken);
    return this.issueToken(payload, 'access');
  }
}
