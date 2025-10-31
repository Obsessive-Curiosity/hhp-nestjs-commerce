import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');

  // .env
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3000;
  const env = configService.get<string>('NODE_ENV') || 'development';
  const isDevelopment = env === 'development';

  // Start server
  await app.listen(port);

  // Logging
  logger.log('═'.repeat(60));
  logger.log('🚀 NestJS Application Started');
  logger.log('═'.repeat(60));
  logger.log(`📡 Environment: ${env}`);
  logger.log(`🔌 Port: ${port}`);

  if (isDevelopment) {
    logger.log('─'.repeat(60));
    logger.log(`🌐 Backend URL: http://localhost:${port}`);
  }
  logger.log('═'.repeat(60));
}
bootstrap();
