import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/core';
import { StockService } from '@/product/domain/service/stock.service';

export interface DeductStockItem {
  productId: string;
  quantity: number;
}

export interface DeductStockParams {
  items: DeductStockItem[];
}

@Injectable()
export class DeductStockTransaction {
  constructor(private readonly stockService: StockService) {}

  @Transactional()
  async execute(
    params: DeductStockParams,
  ): Promise<{ deductedItems: DeductStockItem[] }> {
    const { items } = params;

    // Deadlock 방지: productId로 정렬하여 항상 동일한 순서로 락 획득
    const sortedItems = [...items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    const deductedItems: DeductStockItem[] = [];

    for (const item of sortedItems) {
      await this.stockService.decreaseStock(item.productId, item.quantity);
      deductedItems.push(item);
    }

    return { deductedItems };
  }
}
