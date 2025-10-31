import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface JwtConfig {
  accessTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
}

@Injectable()
export class JwtConfigValidator {
  constructor(private readonly configService: ConfigService) {}

  get accessTokenSecret() {
    const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined');
    }
    return secret;
  }

  get accessTokenExpiresIn() {
    return this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN', '1h');
  }

  get refreshTokenSecret() {
    const secret = this.configService.get<string>('REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined');
    }
    return secret;
  }

  get refreshTokenExpiresIn() {
    return this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN', '7d');
  }

  // 전체 config 반환
  getConfig(): JwtConfig {
    return {
      accessTokenSecret: this.accessTokenSecret,
      accessTokenExpiresIn: this.accessTokenExpiresIn,
      refreshTokenSecret: this.refreshTokenSecret,
      refreshTokenExpiresIn: this.refreshTokenExpiresIn,
    };
  }
}
