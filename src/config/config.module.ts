import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { JwtConfigValidator } from './validators/jwt-config.validator';
import { envValidationSchema } from './env.validation';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // 모든 에러 표시
      },
    }),
  ],
  providers: [JwtConfigValidator],
  exports: [JwtConfigValidator],
})
export class ConfigModule {}
