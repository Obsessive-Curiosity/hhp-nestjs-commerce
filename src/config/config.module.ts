import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { JwtConfigValidator } from './validators/jwt-config.validator';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [JwtConfigValidator],
  exports: [JwtConfigValidator],
})
export class ConfigModule {}
