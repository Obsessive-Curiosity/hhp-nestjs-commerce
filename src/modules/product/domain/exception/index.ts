import { BadRequestException, NotFoundException } from '@nestjs/common';

// =================== Product Exceptions ===================

export class DeletedProductException extends BadRequestException {
  constructor() {
    super('삭제된 상품은 수정할 수 없습니다.');
  }
}

export class ProductAlreadyDeletedException extends BadRequestException {
  constructor() {
    super('이미 삭제된 상품입니다.');
  }
}

export class ProductPricingRequiredException extends BadRequestException {
  constructor() {
    super('소매가 또는 도매가 중 최소 하나는 입력해야 합니다.');
  }
}

export class InvalidProductPricingException extends BadRequestException {
  constructor() {
    super('B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.');
  }
}

// =================== Stock Exceptions ===================

export class StockNotFoundException extends NotFoundException {
  constructor(productId: string) {
    super(`상품 ID ${productId}의 재고를 찾을 수 없습니다.`);
  }
}

export class InvalidInitialStockException extends BadRequestException {
  constructor() {
    super('초기 재고는 0 이상이어야 합니다.');
  }
}

export class InvalidStockQuantityException extends BadRequestException {
  constructor(operation: 'increase' | 'decrease') {
    const message =
      operation === 'increase'
        ? '증가할 수량은 0보다 커야 합니다.'
        : '감소할 수량은 0보다 커야 합니다.';
    super(message);
  }
}

export class InsufficientStockException extends BadRequestException {
  constructor(currentQuantity: number, requestedQuantity: number) {
    super(
      `재고가 부족합니다. 현재 재고: ${currentQuantity}, 요청 수량: ${requestedQuantity}`,
    );
  }
}
