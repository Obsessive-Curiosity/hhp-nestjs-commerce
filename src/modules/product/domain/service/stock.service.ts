import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Stock } from '../entity/stock.entity';
import { StockRepository } from '../../infrastructure/stock.repository';

@Injectable()
export class StockService {
  constructor(private readonly stockRepository: StockRepository) {}

  // ==================== 조회 (Query) ====================

  // 재고 조회 (예외 발생)
  async getStock(productId: string): Promise<Stock> {
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
  ): Promise<Stock> {
    const stock = Stock.create(initialQuantity);
    stock.productId = productId;
    return this.stockRepository.save(stock);
  }

  // ==================== 수정 (Update) ====================

  // 재고 증가
  async increaseStock(productId: string, quantity: number): Promise<void> {
    // 입력 검증
    if (quantity <= 0) {
      throw new BadRequestException('증가할 수량은 0보다 커야 합니다.');
    }

    // 재고 증가 (Repository에서 트랜잭션 처리)
    await this.stockRepository.increase(productId, quantity);
  }

  // 재고 감소
  async decreaseStock(productId: string, quantity: number): Promise<void> {
    // 입력 검증
    if (quantity <= 0) {
      throw new BadRequestException('감소할 수량은 0보다 커야 합니다.');
    }

    // 재고 감소 (Repository에서 트랜잭션 처리)
    await this.stockRepository.decrease(productId, quantity);
  }
}
