import { UnauthorizedException as NestUnauthorizedException } from '@nestjs/common';
import { UnauthorizedErrorCode } from '../constants/error-responses.constant';

/**
 * 커스텀 401 Unauthorized Exception
 *
 * @description
 * NestJS의 UnauthorizedException을 확장하여 에러 코드 enum을 사용
 * AllExceptionsFilter에서 UnauthorizedErrorCode를 기반으로 에러 응답 생성
 *
 */
export class UnauthorizedException extends NestUnauthorizedException {
  constructor(errorCode: UnauthorizedErrorCode) {
    super(errorCode); // enum 값을 message로 전달
  }
}
