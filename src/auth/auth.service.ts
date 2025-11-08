import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtConfigValidator } from '../config/validators/jwt-config.validator';
import { PrismaService } from '../prisma/prisma.service';
import { Payload } from '../types/express';
import { Prisma } from '@prisma/client';
import { UserService } from '@/user/domain/service/user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly jwtConfig: JwtConfigValidator,
    private readonly userService: UserService,
  ) {}

  async signup(dto: Prisma.UserCreateInput) {
    const { role, email, password, name, phone } = dto;
    const createDto = { role, email, password, name, phone };

    // 이메일 중복 체크
    const existingUser = await this.prisma.user.findFirst({
      where: { email, role, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 사용자 생성 (Point도 함께 생성)
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          ...createDto,
          password: hashedPassword,
        },
        select: {
          id: true,
          role: true,
          email: true,
          name: true,
          phone: true,
          createdAt: true,
        },
      });

      // 포인트 초기화
      await tx.point.create({
        data: {
          userId: newUser.id,
          amount: 0,
        },
      });

      return newUser;
    });

    return {
      message: '회원가입이 완료되었습니다.',
      user,
    };
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
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보 입니다!');
    }

    const passOK = await bcrypt.compare(password, user.password);

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
