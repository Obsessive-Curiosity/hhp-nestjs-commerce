import { defineConfig, MySqlDriver } from '@mikro-orm/mysql';
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

  // MikroORM 드라이버 설정
  driver: MySqlDriver,

  // 커넥션 풀 설정 (성능 최적화)
  pool: {
    min: 5, // 최소 연결 수 (항상 유지)
    max: 50, // 최대 연결 수 (동시 처리 가능한 요청 수)
    acquireTimeoutMillis: 30000, // 연결 획득 타임아웃 (30초)
    idleTimeoutMillis: 600000, // 유휴 연결 제거 시간 (10분)
  },

  // 쿼리 타임아웃 설정
  driverOptions: {
    connection: {
      timezone: '+09:00', // 한국 시간대
      connectTimeout: 10000, // 연결 타임아웃 (10초)
      // MySQL 세션 타임아웃 설정
      waitForConnections: true,
    },
  },

  // 엔티티 경로 설정
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],

  // 메타데이터 제공자 설정
  metadataProvider: TsMorphMetadataProvider,

  // SQL 쿼리 로깅 설정
  debug: true,

  // Global context 설정
  allowGlobalContext: true,

  // Soft delete 글로벌 필터 설정
  filters: {
    softDelete: {
      cond: { deletedAt: null },
      default: true,
      entity: ['User', 'Product'], // soft delete를 사용하는 엔티티 목록
    },
  },

  // 마이그레이션 설정
  migrations: {
    path: './src/common/database/migrations',
    pathTs: './src/common/database/migrations',
    tableName: 'mikro_orm_migrations',
    transactional: true,
  },
});
