import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Role } from '@/modules/user/domain/entity/user.entity';
import { Type } from 'class-transformer';

export class PhoneNumberDto {
  @IsString({ message: '전화번호는 문자열이어야 합니다' })
  @Matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다',
  })
  @IsNotEmpty({ message: '전화번호를 입력해주세요' })
  number: string;

  @IsOptional()
  @IsString()
  type?: string; // 'personal', 'company' 등
}

export class CreateUserDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsNotEmpty({ message: '이메일을 입력해주세요' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요' })
  password: string;

  @IsString({ message: '이름은 문자열이어야 합니다' })
  @IsNotEmpty({ message: '이름을 입력해주세요' })
  name: string;

  @ValidateNested()
  @Type(() => PhoneNumberDto)
  @IsNotEmpty({ message: '개인 전화번호를 입력해주세요' })
  personalPhone: PhoneNumberDto;

  @ValidateNested()
  @Type(() => PhoneNumberDto)
  @IsOptional()
  companyPhone?: PhoneNumberDto;

  @IsEnum(Role, { message: '올바른 역할이 아닙니다' })
  @IsOptional()
  role?: Role;
}
