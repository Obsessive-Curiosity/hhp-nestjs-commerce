import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsInt({ message: '카테고리 ID는 정수여야 합니다.' })
  @IsPositive({ message: '카테고리 ID는 양수여야 합니다.' })
  categoryId: number;

  @IsString({ message: '상품명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '상품명을 입력해주세요.' })
  @MinLength(1, { message: '상품명을 입력해주세요.' })
  @MaxLength(100, { message: '상품명은 최대 100자까지 입력 가능합니다.' })
  name: string;

  @IsOptional()
  @IsNumber({}, { message: '소매가는 숫자여야 합니다.' })
  @IsInt({ message: '소매가는 정수여야 합니다.' })
  @Min(0, { message: '소매가는 0 이상이어야 합니다.' })
  @Max(99999999, { message: '가격은 99,999,999 이하이어야 합니다.' })
  retailPrice?: number;

  @IsOptional()
  @IsNumber({}, { message: '도매가는 숫자여야 합니다.' })
  @IsInt({ message: '도매가는 정수여야 합니다.' })
  @Min(0, { message: '도매가는 0 이상이어야 합니다.' })
  @Max(99999999, { message: '가격은 99,999,999 이하이어야 합니다.' })
  wholesalePrice?: number;

  @IsString({ message: '상품 설명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '상품 설명을 입력해주세요.' })
  @MinLength(1, { message: '상품 설명을 입력해주세요.' })
  @MaxLength(5000, { message: '상품 설명은 최대 5000자까지 입력 가능합니다.' })
  description: string;

  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이 아닙니다.' })
  imageUrl?: string | null;

  @IsInt({ message: '재고는 정수여야 합니다.' })
  @Min(0, { message: '재고는 0 이상이어야 합니다.' })
  stock: number;
}
