import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app/app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

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

  // 요청 타임아웃 설정 (성능 최적화)
  app.use((req: Request, res: Response, next: NextFunction) => {
    // 요청 타임아웃 (30초)
    req.setTimeout(30000, () => {
      logger.warn(`Request timeout: ${req.method} ${req.url}`);
      res.status(408).send({ message: 'Request Timeout' });
    });

    // 응답 타임아웃 (30초)
    res.setTimeout(30000, () => {
      logger.warn(`Response timeout: ${req.method} ${req.url}`);
    });

    next();
  });

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
