/**
 * 401 Unauthorized 에러 코드 enum
 *
 * @description
 * 인증 실패 시 사용하는 에러 코드 정의
 */
export enum UnauthorizedErrorCode {
  /** 토큰 만료 */
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  /** 토큰 없음 */
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  /** 유효하지 않은 토큰 */
  INVALID_TOKEN = 'INVALID_TOKEN',
  /** 인증 실패 */
  AUTH_FAILED = 'AUTH_FAILED',
  /** 블랙리스트에 등록된 토큰 (로그아웃됨) */
  BLOCKED_TOKEN = 'BLOCKED_TOKEN',
  /** 알 수 없는 인증 에러 */
  UNKNOWN_AUTH_ERROR = 'UNKNOWN_AUTH_ERROR',
}

/**
 * 에러 응답 인터페이스
 */
export interface ErrorResponse {
  /** 사용자에게 보여줄 에러 메시지 */
  errorMessage: string;
  /** 에러 코드 */
  errorCode: UnauthorizedErrorCode;
}

/**
 * 401 Unauthorized 에러 응답 매핑
 *
 * @description
 * AllExceptionsFilter에서 UnauthorizedErrorCode를 기반으로
 * 적절한 에러 메시지를 찾아 응답
 */
export const UNAUTHORIZED_ERRORS: Record<string, ErrorResponse> = {
  TOKEN_EXPIRED: {
    errorMessage: '토큰이 만료되었습니다.',
    errorCode: UnauthorizedErrorCode.TOKEN_EXPIRED,
  },
  TOKEN_NOT_FOUND: {
    errorMessage: '인증 토큰이 필요합니다.',
    errorCode: UnauthorizedErrorCode.TOKEN_NOT_FOUND,
  },
  INVALID_TOKEN: {
    errorMessage: '유효하지 않은 토큰입니다.',
    errorCode: UnauthorizedErrorCode.INVALID_TOKEN,
  },
  AUTH_FAILED: {
    errorMessage: '인증에 실패했습니다.',
    errorCode: UnauthorizedErrorCode.AUTH_FAILED,
  },
  BLOCKED_TOKEN: {
    errorMessage: '차단된 토큰입니다!',
    errorCode: UnauthorizedErrorCode.BLOCKED_TOKEN,
  },
  UNKNOWN_AUTH_ERROR: {
    errorMessage: '인증 오류가 발생했습니다.',
    errorCode: UnauthorizedErrorCode.UNKNOWN_AUTH_ERROR,
  },
};

/**
 * UnauthorizedErrorCode의 키 타입
 */
export type UnauthorizedErrorKey = keyof typeof UNAUTHORIZED_ERRORS;
