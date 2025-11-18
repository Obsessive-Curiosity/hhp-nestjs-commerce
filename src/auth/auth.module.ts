import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '@/user/infrastructure/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { WalletModule } from '@/wallet/infrastructure/wallet.module';

@Module({
  imports: [PassportModule, UserModule, WalletModule],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
