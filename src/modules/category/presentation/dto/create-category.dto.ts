import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString({ message: '카테고리 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '카테고리 이름을 입력해주세요.' })
  @MaxLength(50, { message: '카테고리 이름은 최대 50자까지 입력 가능합니다.' })
  name: string;

  @IsBoolean({ message: '활성화 상태는 boolean 타입이어야 합니다.' })
  @IsOptional()
  active?: boolean = true;
}
