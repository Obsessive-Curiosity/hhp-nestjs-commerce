import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductStock } from '../entity/product-stock.entity';
import {
  IStockRepository,
  STOCK_REPOSITORY,
} from '../interface/stock.repository.interface';

@Injectable()
export class StockService {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: IStockRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // 재고 조회 (예외 발생)
  async getStock(productId: string): Promise<ProductStock> {
    const stock = await this.stockRepository.findByProductId(productId);

    if (!stock) {
      throw new NotFoundException(
        `상품 ID ${productId}의 재고를 찾을 수 없습니다.`,
      );
    }

    return stock;
  }

  // 재고 수량 조회
  async getStockQuantity(productId: string): Promise<number> {
    return this.stockRepository.getQuantity(productId);
  }

  // 재고 확인 (충분한지)
  async hasStock(productId: string, quantity: number): Promise<boolean> {
    const stock = await this.stockRepository.findByProductId(productId);

    if (!stock) {
      return false;
    }

    return stock.hasStock(quantity);
  }

  // 재고 부족 확인
  async isOutOfStock(productId: string): Promise<boolean> {
    const stock = await this.stockRepository.findByProductId(productId);

    if (!stock) {
      return true;
    }

    return stock.isOutOfStock();
  }

  // 재고 확인 및 예외 처리
  async checkStock(productId: string, quantity: number) {
    const stock = await this.getStock(productId);
    if (!stock.hasStock(quantity)) {
      throw new BadRequestException(
        `재고가 부족합니다. (요청: ${quantity}, 재고: ${stock.quantity})`,
      );
    }
    return true;
  }

  // ==================== 생성 (Create) ====================

  // 재고 생성
  async createStock(
    productId: string,
    initialQuantity: number = 0,
  ): Promise<ProductStock> {
    return this.stockRepository.createStock(productId, initialQuantity);
  }

  // ==================== 수정 (Update) ====================

  // 재고 증가 (비관적 락 사용)
  async increaseStock(productId: string, quantity: number): Promise<void> {
    // 입력 검증
    if (quantity <= 0) {
      throw new BadRequestException('증가할 수량은 0보다 커야 합니다.');
    }

    // Pessimistic Locking을 사용한 재고 증가
    await this.stockRepository.increaseWithLock(productId, quantity);
  }

  // 재고 감소 (비관적 락 사용 - SELECT FOR UPDATE)
  async decreaseStock(productId: string, quantity: number): Promise<void> {
    // 입력 검증
    if (quantity <= 0) {
      throw new BadRequestException('감소할 수량은 0보다 커야 합니다.');
    }

    // Pessimistic Locking을 사용한 재고 감소
    // Repository에서 락 획득, 검증, 감소를 원자적으로 처리
    await this.stockRepository.decreaseWithLock(productId, quantity);
  }

  // 재고 증가 (비관적 락 사용 - 롤백/반품용)
  async increaseStockWithLock(
    productId: string,
    quantity: number,
  ): Promise<void> {
    // 입력 검증
    if (quantity <= 0) {
      throw new BadRequestException('증가할 수량은 0보다 커야 합니다.');
    }

    // Pessimistic Locking을 사용한 재고 증가
    // 롤백 시나리오에서 사용 - 반드시 성공해야 함
    await this.stockRepository.increaseWithLock(productId, quantity);
  }
}
