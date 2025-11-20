import { MikroORM, Options, OptimisticLockError } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { MySqlContainer, StartedMySqlContainer } from '@testcontainers/mysql';
import { WalletService } from './wallet.service';
import { WalletRepository } from '../../infrastructure/wallet.repository';
import { User } from '../../../user/domain/entity/user.entity';
import { Wallet } from '../entity/wallet.entity';

interface TestDatabase {
  orm: MikroORM<MySqlDriver>;
  container: StartedMySqlContainer;
}

describe('WalletService - 동시성 테스트 (낙관적 락)', () => {
  let testDb: TestDatabase;
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    // MySQL 컨테이너 시작
    const container = await new MySqlContainer('mysql:8.4')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withRootPassword('test_password')
      .withExposedPorts(3306)
      .start();

    // MikroORM 설정 (User, Wallet만 필요)
    const config: Options = {
      host: container.getHost(),
      port: container.getPort(),
      user: container.getUsername(),
      password: container.getUserPassword(),
      dbName: container.getDatabase(),
      driver: MySqlDriver,
      entities: [User, Wallet],
      metadataProvider: TsMorphMetadataProvider,
      debug: false,
      allowGlobalContext: true,
    };

    orm = (await MikroORM.init(config)) as MikroORM<MySqlDriver>;

    // 스키마 생성
    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.createSchema();

    testDb = { orm, container };
  }, 60000);

  afterAll(async () => {
    await orm.close(true);
    await testDb.container.stop();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 초기화
    const em = orm.em.fork();
    await em.nativeDelete(Wallet, {});
    await em.nativeDelete(User, {});
    await em.flush();
  });

  describe('동시 잔액 차감', () => {
    it('잔액 10,000원에 3,000원 차감을 3번 동시에 하면 낙관적 락으로 일부만 성공한다', async () => {
      // Given: 사용자 및 지갑 생성 (잔액 10,000원)
      let userId!: string;

      await orm.em.fork().transactional(async (em) => {
        const user = User.create({
          email: 'test@test.com',
          name: '테스트 사용자',
          password: 'password',
          personalPhone: { number: '010-1234-5678' },
        });
        em.persist(user);

        const wallet = Wallet.create(user.id);
        wallet.charge(10000);
        em.persist(wallet);

        await em.flush();
        userId = user.id;
      });

      // When: 3,000원 차감을 3번 동시 실행
      const concurrentRequests = Array.from({ length: 3 }, () =>
        orm.em
          .fork()
          .transactional(async (em) => {
            const walletRepo = new WalletRepository(em);
            const walletService = new WalletService(walletRepo);
            return walletService.use(userId, 3000);
          })
          .catch((error: Error) => error),
      );

      const results = await Promise.all(concurrentRequests);

      // Then: 낙관적 락으로 인해 일부만 성공
      const successes = results.filter((r) => !(r instanceof Error));
      const failures = results.filter((r): r is Error => r instanceof Error);

      // 최소 1개는 성공, 나머지는 OptimisticLockError
      expect(successes.length).toBeGreaterThanOrEqual(1);
      expect(failures.length).toBeGreaterThan(0);

      failures.forEach((error) => {
        expect(error instanceof OptimisticLockError).toBe(true);
      });

      // 최종 지갑 잔액 확인 (성공한 만큼만 차감)
      const finalWallet = await orm.em.fork().findOne(Wallet, { userId });
      const expectedBalance = 10000 - 3000 * successes.length;
      expect(finalWallet?.balance).toBe(expectedBalance);
    }, 30000);

    it('잔액 10,000원에 3,000원 차감을 5번 동시에 하면 일부만 성공하고 나머지는 실패한다', async () => {
      // Given: 사용자 및 지갑 생성 (잔액 10,000원)
      let userId!: string;

      await orm.em.fork().transactional(async (em) => {
        const user = User.create({
          email: 'test@test.com',
          name: '테스트 사용자',
          password: 'password',
          personalPhone: { number: '010-1234-5678' },
        });
        em.persist(user);

        const wallet = Wallet.create(user.id);
        wallet.charge(10000);
        em.persist(wallet);

        await em.flush();
        userId = user.id;
      });

      // When: 3,000원 차감을 5번 동시 시도
      const concurrentRequests = Array.from({ length: 5 }, () =>
        orm.em
          .fork()
          .transactional(async (em) => {
            const walletRepo = new WalletRepository(em);
            const walletService = new WalletService(walletRepo);
            return walletService.use(userId, 3000);
          })
          .catch((error: Error) => error),
      );

      const results = await Promise.all(concurrentRequests);

      // Then: 일부 성공, 일부 실패 (잔액 부족 또는 OptimisticLockError)
      const successes = results.filter((r) => !(r instanceof Error));
      const failures = results.filter((r): r is Error => r instanceof Error);

      // 최소 1개는 성공, 최대 3개까지 성공 가능 (10,000 / 3,000 = 3)
      expect(successes.length).toBeGreaterThanOrEqual(1);
      expect(successes.length).toBeLessThanOrEqual(3);
      expect(failures.length).toBeGreaterThan(0);

      // 실패는 잔액 부족 또는 OptimisticLockError
      failures.forEach((error) => {
        expect(
          error instanceof OptimisticLockError ||
            error.message.includes('잔액이 부족합니다'),
        ).toBe(true);
      });

      // 최종 지갑 잔액 확인 (성공한 만큼만 차감)
      const finalWallet = await orm.em.fork().findOne(Wallet, { userId });
      const expectedBalance = 10000 - 3000 * successes.length;
      expect(finalWallet?.balance).toBe(expectedBalance);
    }, 30000);

    it('여러 사용자가 동시에 차감해도 각자의 지갑은 정확히 차감되어야 한다', async () => {
      // Given: 3명의 사용자 생성 (각 잔액 5,000원)
      const userIds: string[] = [];

      await orm.em.fork().transactional(async (em) => {
        for (let i = 0; i < 3; i++) {
          const user = User.create({
            email: `test${i}@test.com`,
            name: `사용자${i}`,
            password: 'password',
            personalPhone: { number: '010-1234-5678' },
          });
          em.persist(user);
          await em.flush();

          const wallet = Wallet.create(user.id);
          wallet.charge(5000);
          em.persist(wallet);

          userIds.push(user.id);
        }

        await em.flush();
      });

      // When: 3명이 동시에 각자 2,000원씩 차감
      const concurrentRequests = userIds.map((userId) =>
        orm.em.fork().transactional(async (em) => {
          const walletRepo = new WalletRepository(em);
          const walletService = new WalletService(walletRepo);
          return walletService.use(userId, 2000);
        }),
      );

      const results = await Promise.all(concurrentRequests);

      // Then: 모든 차감 성공 (서로 다른 지갑이므로 충돌 없음)
      expect(results).toHaveLength(3);

      // 각 사용자의 지갑 잔액 확인
      for (const userId of userIds) {
        const wallet = await orm.em.fork().findOne(Wallet, { userId });
        expect(wallet?.balance).toBe(3000); // 5,000 - 2,000 = 3,000
      }
    }, 30000);
  });
});
