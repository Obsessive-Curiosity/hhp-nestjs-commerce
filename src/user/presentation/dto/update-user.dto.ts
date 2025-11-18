import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

// 모든 필드를 optional로 만들기 위해 PartialType 사용
export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['name', 'personalPhone', 'companyPhone']),
) {
  @IsOptional()
  @IsString({ message: '현재 비밀번호는 문자열이어야 합니다' })
  currentPassword?: string;

  @IsOptional()
  @IsString({ message: '새 비밀번호는 문자열이어야 합니다' })
  @MinLength(8, { message: '새 비밀번호는 최소 8자 이상이어야 합니다' })
  newPassword?: string;
}
