import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class ChargeWalletDto {
  @IsNumber({}, { message: '충전 금액은 숫자여야 합니다.' })
  @IsPositive({ message: '충전 금액은 0보다 커야 합니다.' })
  @Min(1, { message: '충전 금액은 최소 1원 이상이어야 합니다.' })
  @IsNotEmpty({ message: '충전 금액을 입력해주세요.' })
  amount: number;
}
