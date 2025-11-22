import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  TestDatabase,
} from '../../../../test/setup/database.setup';
import { DeductStockTransaction } from './deduct-stock.transaction';
import { StockService } from '../../domain/service/stock.service';
import { StockRepository } from '../../infrastructure/stock.repository';
import { Category } from '../../../category/domain/entity/category.entity';
import { Product } from '../../domain/entity/product.entity';
import { ProductStock } from '../../domain/entity/product-stock.entity';

describe('DeductStockTransaction - 동시성 테스트', () => {
  let testDb: TestDatabase;
  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    // TestContainers MySQL 시작
    testDb = await setupTestDatabase();
    orm = testDb.orm;
  }, 60000); // 컨테이너 시작 시간 여유

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터 초기화
    await clearTestData(orm);
  });

  describe('동시 재고 차감', () => {
    it('10명이 동시에 같은 상품(재고 10개)을 1개씩 주문하면 최종 재고는 0이 되어야 한다', async () => {
      // Given: 카테고리, 상품, 재고 생성
      let product!: Product;

      await orm.em.fork().transactional(async (em) => {
        const category = Category.create('테스트 카테고리', true);
        em.persist(category);
        await em.flush(); // categoryId를 얻기 위해 flush

        product = Product.create({
          categoryId: category.id,
          name: '테스트 상품',
          retailPrice: 10000,
          wholesalePrice: 8000,
          description: '테스트 상품 설명',
        });
        em.persist(product);
        await em.flush(); // productId를 얻기 위해 flush

        const stock = ProductStock.create(10);
        stock.productId = product.id;
        em.persist(stock);

        await em.flush();
      });

      // When: 10명이 동시에 재고 1개씩 차감
      const concurrentRequests = Array.from({ length: 10 }, () =>
        orm.em.fork().transactional(async (em) => {
          // 각 요청마다 새로운 EntityManager 사용
          const stockRepository = new StockRepository(em);
          const stockService = new StockService(stockRepository);
          const transaction = new DeductStockTransaction(stockService);

          return transaction.execute({
            items: [{ productId: product.id, quantity: 1 }],
          });
        }),
      );

      const results = await Promise.all(concurrentRequests);

      // Then: 모든 요청이 성공해야 함
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.deductedItems).toHaveLength(1);
        expect(result.deductedItems[0].productId).toBe(product.id);
      });

      // 최종 재고 확인
      const finalStock = await orm.em.fork().findOne(ProductStock, {
        productId: product.id,
      });
      expect(finalStock?.quantity).toBe(0);
    }, 30000);

    it('재고(5개)보다 많은 요청(10명)이 오면 일부는 실패해야 한다', async () => {
      // Given: 재고 5개인 상품 생성
      let product!: Product;

      await orm.em.fork().transactional(async (em) => {
        const category = Category.create('테스트 카테고리', true);
        em.persist(category);
        await em.flush();

        product = Product.create({
          categoryId: category.id,
          name: '테스트 상품',
          retailPrice: 10000,
          wholesalePrice: 8000,
          description: '테스트 상품 설명',
        });
        em.persist(product);
        await em.flush();

        const stock = ProductStock.create(5);
        stock.productId = product.id;
        em.persist(stock);

        await em.flush();
      });

      // When: 10명이 동시에 재고 1개씩 차감 시도
      const concurrentRequests = Array.from({ length: 10 }, () =>
        orm.em
          .fork()
          .transactional(async (em) => {
            const stockRepository = new StockRepository(em);
            const stockService = new StockService(stockRepository);
            const transaction = new DeductStockTransaction(stockService);

            return transaction.execute({
              items: [{ productId: product.id, quantity: 1 }],
            });
          })
          .catch((error: Error) => error),
      );

      const results = await Promise.all(concurrentRequests);

      // Then: 5개는 성공, 5개는 실패
      const successes = results.filter(
        (
          r,
        ): r is {
          deductedItems: Array<{ productId: string; quantity: number }>;
        } =>
          !(r instanceof Error) &&
          'deductedItems' in r &&
          r.deductedItems.length > 0,
      );
      const failures = results.filter((r): r is Error => r instanceof Error);

      expect(successes.length).toBe(5);
      expect(failures.length).toBe(5);

      // 최종 재고는 0이어야 함
      const finalStock = await orm.em.fork().findOne(ProductStock, {
        productId: product.id,
      });
      expect(finalStock?.quantity).toBe(0);
    }, 30000);

    it('여러 상품을 동시에 차감할 때 Deadlock이 발생하지 않아야 한다', async () => {
      // Given: 2개의 상품 생성 (각각 재고 10개)
      let product1Id: string;
      let product2Id: string;

      await orm.em.fork().transactional(async (em) => {
        const category = Category.create('테스트 카테고리', true);
        em.persist(category);
        await em.flush();

        const product1 = Product.create({
          categoryId: category.id,
          name: '상품1',
          retailPrice: 10000,
          wholesalePrice: 8000,
          description: '상품1 설명',
        });
        em.persist(product1);

        const product2 = Product.create({
          categoryId: category.id,
          name: '상품2',
          retailPrice: 20000,
          wholesalePrice: 16000,
          description: '상품2 설명',
        });
        em.persist(product2);

        await em.flush();

        const stock1 = ProductStock.create(10);
        stock1.productId = product1.id;
        em.persist(stock1);

        const stock2 = ProductStock.create(10);
        stock2.productId = product2.id;
        em.persist(stock2);

        await em.flush();

        product1Id = product1.id;
        product2Id = product2.id;
      });

      // When: 10명이 동시에 [상품1, 상품2] 또는 [상품2, 상품1] 순서로 차감
      // DeductStockTransaction은 productId로 정렬하므로 Deadlock 발생하지 않음
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        orm.em.fork().transactional(async (em) => {
          const stockRepository = new StockRepository(em);
          const stockService = new StockService(stockRepository);
          const transaction = new DeductStockTransaction(stockService);

          // 요청마다 순서를 다르게 (Deadlock 유발 시도)
          const items =
            i % 2 === 0
              ? [
                  { productId: product1Id!, quantity: 1 },
                  { productId: product2Id!, quantity: 1 },
                ]
              : [
                  { productId: product2Id!, quantity: 1 },
                  { productId: product1Id!, quantity: 1 },
                ];

          return transaction.execute({ items });
        }),
      );

      // Then: 모든 요청이 성공해야 함 (Deadlock 없음)
      const results = await Promise.all(concurrentRequests);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.deductedItems).toHaveLength(2);
      });

      // 최종 재고 확인
      const finalStock1 = await orm.em.fork().findOne(ProductStock, {
        productId: product1Id!,
      });
      const finalStock2 = await orm.em.fork().findOne(ProductStock, {
        productId: product2Id!,
      });

      expect(finalStock1?.quantity).toBe(0);
      expect(finalStock2?.quantity).toBe(0);
    }, 30000);
  });
});
