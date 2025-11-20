import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // 환경
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // MySQL
  MYSQL_ROOT_PASSWORD: Joi.string().required(),
  MYSQL_DATABASE: Joi.string().required(),
  MYSQL_DB_HOST: Joi.string().default('localhost'),
  MYSQL_DB_PORT: Joi.number().default(3306),
  MYSQL_DB_USER: Joi.string().default('root'),
  MYSQL_DB_PASSWORD: Joi.string().required(),
  MYSQL_DB_NAME: Joi.string().required(),

  // Database URL (Prisma)
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_CACHE_HOST: Joi.string().required(),
  REDIS_CACHE_PORT: Joi.number().default(6379),

  // JWT
  ACCESS_TOKEN_SECRET: Joi.string().required(),
  REFRESH_TOKEN_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
});
