import { Role, PhoneNumber, User } from '@/user/domain/entity/user.entity';

// 기본 사용자 정보 (회원가입 응답)
export class UserBasicInfoResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  createdAt: Date;

  static from(user: User): UserBasicInfoResponseDto {
    const dto = new UserBasicInfoResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.name = user.name;
    dto.phone = user.personalPhone.number;
    dto.role = user.role ?? Role.GUEST;
    dto.createdAt = user.createdAt;
    return dto;
  }
}

// 상세 사용자 정보 (내 정보 조회 응답)
export class UserDetailInfoResponseDto {
  email: string;
  name: string;
  personalPhone: PhoneNumber;
  companyPhone: PhoneNumber | null;
  role: Role;
  balance: number;
  createdAt: Date;
  updatedAt: Date;

  static from(user: User, balance: number): UserDetailInfoResponseDto {
    const dto = new UserDetailInfoResponseDto();
    dto.email = user.email;
    dto.name = user.name;
    dto.personalPhone = user.personalPhone;
    dto.companyPhone = user.companyPhone ?? null;
    dto.role = user.role ?? Role.GUEST;
    dto.balance = balance;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}

// 업데이트된 사용자 정보
export class UpdatedUserInfoResponseDto {
  email: string;
  name: string;
  personalPhone: PhoneNumber;
  companyPhone: PhoneNumber | null;
  role: Role;
  updatedAt: Date;

  static from(user: User): UpdatedUserInfoResponseDto {
    const dto = new UpdatedUserInfoResponseDto();
    dto.email = user.email;
    dto.name = user.name;
    dto.personalPhone = user.personalPhone;
    dto.companyPhone = user.companyPhone ?? null;
    dto.role = user.role ?? Role.GUEST;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}

// 회원가입 응답
export class CreateAccountResponseDto {
  message: string;
  user: UserBasicInfoResponseDto;

  static from(user: User): CreateAccountResponseDto {
    const dto = new CreateAccountResponseDto();
    dto.message = '회원가입이 완료되었습니다.';
    dto.user = UserBasicInfoResponseDto.from(user);
    return dto;
  }
}

// 내 정보 조회 응답
export class GetMyInfoResponseDto extends UserDetailInfoResponseDto {}

// 내 정보 수정 응답
export class UpdateMyInfoResponseDto {
  message: string;
  user: UpdatedUserInfoResponseDto;

  static from(user: User): UpdateMyInfoResponseDto {
    const dto = new UpdateMyInfoResponseDto();
    dto.message = '회원 정보가 수정되었습니다.';
    dto.user = UpdatedUserInfoResponseDto.from(user);
    return dto;
  }
}

// 회원 탈퇴 응답
export class DeleteAccountResponseDto {
  message: string;

  static from(): DeleteAccountResponseDto {
    const dto = new DeleteAccountResponseDto();
    dto.message = '회원 탈퇴가 완료되었습니다.';
    return dto;
  }
}
