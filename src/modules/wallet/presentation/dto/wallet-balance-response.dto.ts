import { IsNumber, IsDate, IsNotEmpty } from 'class-validator';

export class WalletBalanceResponseDto {
  @IsNumber()
  @IsNotEmpty()
  balance: number;

  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}
