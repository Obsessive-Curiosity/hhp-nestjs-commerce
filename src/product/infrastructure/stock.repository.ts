import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, LockMode } from '@mikro-orm/mysql';
import { ProductStock } from '../domain/entity/product-stock.entity';
import { IStockRepository } from '../domain/interface/stock.repository.interface';

@Injectable()
export class StockRepository implements IStockRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // 상품별 재고 조회
  async findByProductId(productId: string): Promise<ProductStock | null> {
    return await this.em.findOne(ProductStock, { productId });
  }

  // 재고 수량 조회
  async getQuantity(productId: string): Promise<number> {
    const stock = await this.em.findOne(ProductStock, { productId });
    return stock?.quantity ?? 0;
  }

  // 재고 존재 여부 확인
  async exists(productId: string): Promise<boolean> {
    const count = await this.em.count(ProductStock, { productId });
    return count > 0;
  }

  // ==================== 생성 (Create) ====================

  // 재고 저장
  async create(stock: ProductStock): Promise<ProductStock> {
    await this.em.persistAndFlush(stock);
    return stock;
  }

  // 재고 생성
  async createStock(
    productId: string,
    initialQuantity: number,
  ): Promise<ProductStock> {
    const stock = ProductStock.create(initialQuantity);

    // productId 설정
    stock.productId = productId;

    await this.em.persistAndFlush(stock);
    return stock;
  }

  // ==================== 수정 (Update) ====================

  // 비관적 락을 사용한 재고 증가 (롤백/반품용)
  async increaseWithLock(productId: string, quantity: number): Promise<void> {
    // SELECT ... FOR UPDATE - row lock 획득
    const stock = await this.em.findOne(
      ProductStock,
      { productId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );

    if (!stock) {
      throw new NotFoundException(
        `상품 ID ${productId}의 재고를 찾을 수 없습니다.`,
      );
    }

    // 입력 검증
    if (quantity <= 0) {
      throw new BadRequestException('증가할 수량은 0보다 커야 합니다.');
    }

    // 재고 증가 (row lock 획득 상태, 안전하게 수정 가능)
    stock.quantity += quantity;

    // 변경사항 flush (트랜잭션 커밋 시 lock 해제)
    await this.em.flush();
  }

  // 비관적 락을 사용한 재고 감소 (SELECT FOR UPDATE)
  async decreaseWithLock(productId: string, quantity: number): Promise<void> {
    // SELECT ... FOR UPDATE - row lock 획득
    const stock = await this.em.findOne(
      ProductStock,
      { productId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );

    if (!stock) {
      throw new NotFoundException(
        `상품 ID ${productId}의 재고를 찾을 수 없습니다.`,
      );
    }

    // 재고 충분 여부 검증
    if (stock.quantity < quantity) {
      throw new BadRequestException(
        `재고가 부족합니다. 현재 재고: ${stock.quantity}, 요청 수량: ${quantity}`,
      );
    }

    // 재고 감소 (row lock 획득 상태, 안전하게 수정 가능)
    stock.quantity -= quantity;

    // 변경사항 flush (트랜잭션 커밋 시 lock 해제)
    await this.em.flush();
  }
}
