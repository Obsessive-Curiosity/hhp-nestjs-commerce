import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProductStock } from '../entity/product-stock.entity';
import {
  IStockRepository,
  STOCK_REPOSITORY,
} from '../interface/stock.repository.interface';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: IStockRepository,
  ) {}

  // 재고 조회
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

  // 재고 생성
  async createStock(
    productId: string,
    initialQuantity: number = 0,
  ): Promise<ProductStock> {
    const stock = ProductStock.create(productId, initialQuantity);
    return this.stockRepository.create(stock);
  }

  // 재고 증가 (낙관적 락 사용)
  async increaseStock(productId: string, quantity: number): Promise<void> {
    const maxRetries = 5;
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const stock = await this.getStock(productId);

        // Domain Entity를 통한 비즈니스 로직 검증
        if (quantity <= 0) {
          throw new Error('증가할 수량은 0보다 커야 합니다.');
        }

        // Optimistic Locking을 사용한 재고 증가
        await this.stockRepository.increaseWithVersion(
          productId,
          quantity,
          stock.version,
        );

        // 성공하면 리턴
        return;
      } catch (error) {
        lastError = error as Error;

        // 낙관적 락 충돌인 경우에만 재시도
        if (
          error instanceof Error &&
          error.message.includes('재고 증가 실패') &&
          attempt < maxRetries - 1
        ) {
          this.logger.warn(
            `재고 증가 충돌 발생 (시도 ${attempt + 1}/${maxRetries}). 재시도 중...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * (attempt + 1)),
          );
          continue;
        }

        // 다른 예외는 즉시 throw
        throw error;
      }
    }

    // 최대 재시도 횟수 초과
    throw lastError!;
  }

  // 재고 감소 (낙관적 락 사용)
  async decreaseStock(productId: string, quantity: number): Promise<void> {
    const maxRetries = 5;
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const stock = await this.getStock(productId);

        // 재고 충분 여부 확인 (Domain Entity)
        if (!stock.hasStock(quantity)) {
          throw new Error(
            `재고가 부족합니다. 현재 재고: ${stock.quantity}, 요청 수량: ${quantity}`,
          );
        }

        // Optimistic Locking을 사용한 재고 감소
        await this.stockRepository.decreaseWithVersion(
          productId,
          quantity,
          stock.version,
        );

        // 성공하면 리턴
        return;
      } catch (error) {
        lastError = error as Error;

        // 낙관적 락 충돌인 경우에만 재시도
        if (
          error instanceof Error &&
          error.message.includes('재고 감소 실패') &&
          attempt < maxRetries - 1
        ) {
          this.logger.warn(
            `재고 감소 충돌 발생 (시도 ${attempt + 1}/${maxRetries}). 재시도 중...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 50 * (attempt + 1)),
          );
          continue;
        }

        // 다른 예외(재고 부족 등)는 즉시 throw
        throw error;
      }
    }

    // 최대 재시도 횟수 초과
    throw lastError!;
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
}
