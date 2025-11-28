import {
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { WalletHistoryType } from '../../domain/entity/wallet-history.entity';

export class WalletHistoryResponseDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  orderId: string | null;

  @IsEnum(WalletHistoryType)
  @IsNotEmpty()
  type: WalletHistoryType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  balance: number;

  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
}
