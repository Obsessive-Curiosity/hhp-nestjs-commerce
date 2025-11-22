import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
  @IsString({ message: '우편번호는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '우편번호를 입력해주세요' })
  zipCode: string;

  @IsString({ message: '도로명/지번 주소는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '도로명 또는 지번 주소를 입력해주세요' })
  road: string;

  @IsString({ message: '상세주소는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '상세주소를 입력해주세요' })
  detail: string;

  @IsString({ message: '시/도는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '시/도를 입력해주세요' })
  city: string;

  @IsString({ message: '구/군은 문자열이어야 합니다' })
  @IsNotEmpty({ message: '구/군을 입력해주세요' })
  district: string;

  @IsString({ message: '동/읍/면은 문자열이어야 합니다' })
  @IsNotEmpty({ message: '동/읍/면을 입력해주세요' })
  town: string;

  @IsString({ message: '수령인 이름은 문자열이어야 합니다' })
  @IsNotEmpty({ message: '수령인 이름을 입력해주세요' })
  recipientName: string;

  @IsString({ message: '전화번호는 문자열이어야 합니다' })
  @IsNotEmpty({ message: '전화번호를 입력해주세요' })
  phone: string;

  @IsOptional()
  @IsBoolean({ message: '기본 배송지 여부는 true/false여야 합니다' })
  isDefault?: boolean;
}
