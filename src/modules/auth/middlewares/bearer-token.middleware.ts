import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedErrorCode } from '../constants/error-responses.constant';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';
import { Payload } from '@/common/types/express';

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    /// Basic $token
    /// Bearer $token
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    const tokenKey = `TOKEN_${token}`;
    const cachedPayload = await this.cacheManager.get<Payload>(tokenKey);
    if (cachedPayload) {
      req.user = cachedPayload;
      return next();
    }

    const decodedPayload = this.jwtService.decode<Payload>(token);

    if (!decodedPayload || typeof decodedPayload === 'string') {
      throw new UnauthorizedException(UnauthorizedErrorCode.INVALID_TOKEN);
    }

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException(UnauthorizedErrorCode.INVALID_TOKEN);
    }

    try {
      const secretKey =
        decodedPayload.type === 'refresh'
          ? process.env.REFRESH_TOKEN_SECRET
          : process.env.ACCESS_TOKEN_SECRET;

      const payload = await this.jwtService.verifyAsync<Payload>(token, {
        secret: secretKey,
      });

      if (!payload.exp) {
        throw new UnauthorizedException(UnauthorizedErrorCode.INVALID_TOKEN);
      }

      const expiryDate = +new Date(payload.exp * 1000);
      const now = +Date.now();

      const differenceInSeconds = (expiryDate - now) / 1000;

      const ttl = Math.max((differenceInSeconds - 30) * 1000, 1);
      if (ttl > 0) {
        await this.cacheManager.set(tokenKey, payload, ttl);
      }

      req.user = payload;
      next();
    } catch (e: unknown) {
      if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException(UnauthorizedErrorCode.TOKEN_EXPIRED);
      }
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    return token;
  }
}
