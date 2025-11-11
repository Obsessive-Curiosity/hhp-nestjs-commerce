import { defineConfig } from '@mikro-orm/mysql';
import 'dotenv/config';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

// CLI 전용 설정 (NestJS 앱에서는 mikro-orm.module.ts 사용)
export default defineConfig({
  // 데이터베이스 연결 설정
  host: process.env.MYSQL_DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_DB_PORT || '3306'),
  user: process.env.MYSQL_DB_USER || 'root',
  password: process.env.MYSQL_DB_PASSWORD || 'mysql_root_password',
  dbName: process.env.MYSQL_DB_NAME || 'shop_dev',

  // 엔티티 경로 설정
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],

  // 메타데이터 제공자 설정
  metadataProvider: TsMorphMetadataProvider,

  // SQL 쿼리 로깅 설정
  debug: true,

  // Global context 설정
  allowGlobalContext: true,

  // 마이그레이션 설정
  migrations: {
    path: './src/database/migrations',
    pathTs: './src/database/migrations',
    tableName: 'mikro_orm_migrations',
    transactional: true,
  },
});
