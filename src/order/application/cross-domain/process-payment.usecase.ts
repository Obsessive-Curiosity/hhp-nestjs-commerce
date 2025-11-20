import { Injectable, BadRequestException } from '@nestjs/common';
import { Transactional } from '@mikro-orm/core';
import { OrderService } from '@/order/domain/service/order.service';
import { OrderItemService } from '@/order/domain/service/order-item.service';
import { StockService } from '@/product/domain/service/stock.service';
import { WalletService } from '@/wallet/domain/service/wallet.service';
import { CartService } from '@/cart/domain/service/cart.service';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
    private readonly stockService: StockService,
    private readonly walletService: WalletService,
    private readonly cartService: CartService,
  ) {}

  /**
   * 결제 처리
   *
   * FR-018: 지갑으로 결제
   * FR-021: 결제 성공 후 재고 차감
   * BR-027: 결제 완료 후 재고 차감
   * BR-028: 지갑 사용 내역 기록
   */
  @Transactional()
  async execute(orderId: string, userId: string) {
    // 1. 주문 조회 및 권한 검증
    const order = await this.orderService.validateOrderOwnership(
      orderId,
      userId,
    );

    if (!order.isPending()) {
      throw new BadRequestException(
        'PENDING 상태의 주문만 결제할 수 있습니다.',
      );
    }

    // 2. 주문 항목 조회
    const orderItems =
      await this.orderItemService.findOrderItemsByOrderId(orderId);

    if (orderItems.length === 0) {
      throw new BadRequestException('주문 항목이 없습니다.');
    }

    // 3. 지갑 차감 (낙관적 락 재시도 내장)
    // TODO: orderId를 WalletTransactionHistory에 기록하도록 개선 필요
    await this.walletService.use(userId, order.paymentAmount);

    // 4. 재고 차감 (낙관적 락 재시도 내장)
    // 각 주문 항목에 대해 재고 차감
    await Promise.all(
      orderItems.map((item) =>
        this.stockService.decreaseStock(item.productId, item.quantity),
      ),
    );

    // 5. TODO: 쿠폰 사용 처리 (CouponService)
    // if (order.usedCouponId) {
    //   await this.couponService.markAsUsed(order.usedCouponId);
    // }

    // 6. 주문 상태 업데이트 (PAID)
    await this.orderService.markOrderAsPaid(orderId);

    // 7. 장바구니 비우기
    await this.cartService.clearCart(userId);

    return {
      message: '결제가 완료되었습니다.',
      orderId: order.id,
      paymentAmount: order.paymentAmount,
    };
  }
}
