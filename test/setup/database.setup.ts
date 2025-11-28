import { MikroORM, Options } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';

// 엔티티 import (상대 경로 사용)
// 재고 테스트에 필요한 최소 엔티티만 포함
import { Category } from '../../src/modules/category/domain/entity/category.entity';
import { Product } from '../../src/modules/product/domain/entity/product.entity';
import { Stock } from '../../src/modules/product/domain/entity/stock.entity';

export interface TestDatabase {
  orm: MikroORM<MySqlDriver>;
  container: StartedMySqlContainer;
}

/**
 * TestContainers를 사용한 MySQL 테스트 데이터베이스 설정
 *
 * @returns TestDatabase - MikroORM 인스턴스와 컨테이너
 */
export async function setupTestDatabase(): Promise<TestDatabase> {
  // 1. MySQL 컨테이너 시작
  console.log('Starting MySQL container...');
  const container = await new MySqlContainer('mysql:8.4')
    .withDatabase('test_db')
    .withUsername('test_user')
    .withRootPassword('test_password')
    .withExposedPorts(3306)
    .start();

  console.log(
    `MySQL container started at ${container.getHost()}:${container.getPort()}`,
  );

  // 2. MikroORM 설정
  const config: Options = {
    host: container.getHost(),
    port: container.getPort(),
    user: container.getUsername(),
    password: container.getUserPassword(),
    dbName: container.getDatabase(),
    driver: MySqlDriver,
    entities: [Category, Product, Stock],
    metadataProvider: TsMorphMetadataProvider,
    debug: false, // 테스트 시 SQL 로그 최소화
    allowGlobalContext: true,
  };

  // 3. MikroORM 초기화
  console.log('Initializing MikroORM...');
  const orm = (await MikroORM.init(config)) as MikroORM<MySqlDriver>;

  // 4. 스키마 생성
  console.log('Creating database schema...');
  const generator = orm.getSchemaGenerator();
  await generator.ensureDatabase();
  await generator.createSchema();

  console.log('Test database setup complete!');

  return { orm, container };
}

/**
 * 테스트 데이터베이스 정리
 *
 * @param testDb - setupTestDatabase()로 생성된 TestDatabase
 */
export async function cleanupTestDatabase(testDb: TestDatabase): Promise<void> {
  console.log('Cleaning up test database...');

  // 1. MikroORM 종료
  await testDb.orm.close(true);

  // 2. 컨테이너 중지
  await testDb.container.stop();

  console.log('Test database cleanup complete!');
}

/**
 * 테스트 데이터 초기화 (각 테스트 케이스 실행 전)
 *
 * @param orm - MikroORM 인스턴스
 */
export async function clearTestData(orm: MikroORM): Promise<void> {
  const em = orm.em.fork();

  // 외래키 제약조건 때문에 순서가 중요
  await em.nativeDelete(Stock, {});
  await em.nativeDelete(Product, {});
  await em.nativeDelete(Category, {});

  await em.flush();
}
