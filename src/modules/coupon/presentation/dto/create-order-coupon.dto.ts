import { CouponType } from '@/modules/coupon/domain/entity/coupon.entity';
import { IsString, IsNotEmpty, MaxLength, IsEnum, IsInt, IsPositive, Min, Max, IsOptional, IsDate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'DiscountAmountRequired', async: false })
export class DiscountAmountRequiredConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as CreateOrderCouponDto;
    if (object.type === CouponType.AMOUNT) {
      return !!object.discountAmount;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'AMOUNT 타입 쿠폰은 할인 금액이 필수입니다.';
  }
}

@ValidatorConstraint({ name: 'DiscountRateRequired', async: false })
export class DiscountRateRequiredConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as CreateOrderCouponDto;
    if (object.type === CouponType.RATE) {
      return !!object.discountRate;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'RATE 타입 쿠폰은 할인율이 필수입니다.';
  }
}

export class CreateOrderCouponDto {
  @IsString({ message: '쿠폰명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '쿠폰명을 입력해주세요.' })
  @MaxLength(100, { message: '쿠폰명은 최대 100자까지 입력 가능합니다.' })
  name: string;

  // Order 쿠폰은 RATE 또는 AMOUNT 타입 가능
  @IsEnum(CouponType, { message: '쿠폰 타입은 RATE 또는 AMOUNT여야 합니다.' })
  @Validate(DiscountAmountRequiredConstraint)
  @Validate(DiscountRateRequiredConstraint)
  type: CouponType;

  @IsOptional()
  @IsInt({ message: '할인 금액은 정수여야 합니다.' })
  @IsPositive({ message: '할인 금액은 양수여야 합니다.' })
  discountAmount?: number | null;

  @IsOptional()
  @IsInt({ message: '할인율은 정수여야 합니다.' })
  @Min(1, { message: '할인율은 1 이상이어야 합니다.' })
  @Max(100, { message: '할인율은 100 이하여야 합니다.' })
  discountRate?: number | null;

  @IsOptional()
  @IsInt({ message: '최대 할인 금액은 정수여야 합니다.' })
  @IsPositive({ message: '최대 할인 금액은 양수여야 합니다.' })
  maxDiscountAmount?: number | null;

  @IsInt({ message: '최소 구매 금액은 정수여야 합니다.' })
  @Min(0, { message: '최소 구매 금액은 0 이상이어야 합니다.' })
  minPurchaseAmount: number;

  @IsDate({ message: '유효한 날짜 형식이 아닙니다.' })
  @Type(() => Date)
  startAt: Date;

  @IsOptional()
  @IsDate({ message: '유효한 날짜 형식이 아닙니다.' })
  @Type(() => Date)
  endAt?: Date | null;

  @IsOptional()
  @IsInt({ message: '유효 기간은 정수여야 합니다.' })
  @IsPositive({ message: '유효 기간은 양수여야 합니다.' })
  validityDays?: number | null;

  @IsOptional()
  @IsInt({ message: '발급 수량은 정수여야 합니다.' })
  @IsPositive({ message: '발급 수량은 양수여야 합니다.' })
  totalQuantity?: number | null; // null = 무제한
}
