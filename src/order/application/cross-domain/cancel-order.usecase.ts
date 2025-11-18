import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderService } from '@/order/domain/service/order.service';
import { OrderItemService } from '@/order/domain/service/order-item.service';
import { WalletService } from '@/wallet/domain/service/wallet.service';
import { UserCouponService } from '@/coupon/domain/service/user-coupon.service';
import { StockService } from '@/product/domain/service/stock.service';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
    private readonly walletService: WalletService,
    private readonly userCouponService: UserCouponService,
    private readonly stockService: StockService,
  ) {}

  /**
   * 주문 취소
   *
   * FR-023: 부분 실패 시 실패한 항목 제외하고 결제 금액 재계산 후 환불
   * BR-029: 지갑 즉시 환불
   * BR-030: 쿠폰 복원 조건 (전체 취소 + SHIPPED 전)
   * BR-031: 부분 취소 시 쿠폰 미복원
   * BR-032: 부분 취소 시 취소된 OrderItem의 paymentAmount만 환불
   */
  async execute(orderId: string, userId: string) {
    // 1. 주문 조회 및 권한 검증
    const order = await this.orderService.validateOrderOwnership(
      orderId,
      userId,
    );

    if (!order.canCancel()) {
      throw new BadRequestException(
        '주문을 취소할 수 없습니다. (취소 가능 상태: PENDING, PAID)',
      );
    }

    // 2. 주문 취소 처리
    await this.orderService.cancelOrder(orderId);

    // 3. 지갑 환불 (낙관적 락 재시도 내장)
    // BR-029: 사용한 금액 즉시 환불
    // TODO: orderId를 WalletTransactionHistory에 기록하도록 개선 필요
    await this.walletService.refund(userId, order.paymentAmount);

    // 4. 쿠폰 복원
    // BR-030: 전체 취소 + SHIPPED 전일 때만 복원
    // BR-031: 부분 취소 시 쿠폰 미복원
    const allItemsCancelled = true; // 현재는 전체 취소만 지원
    if (allItemsCancelled && order.isBeforeShipped() && order.usedCouponId) {
      await this.userCouponService.restoreCoupon(order.usedCouponId);
    }

    // 5. 재고 복원
    // 주문 항목 조회 및 재고 복원 (결제 완료 이후 주문인 경우)
    const orderItems =
      await this.orderItemService.findOrderItemsByOrderId(orderId);
    if (order.isPaid() || order.isShipped()) {
      // 결제 완료 또는 배송 중인 주문의 경우 재고 복원
      await Promise.all(
        orderItems.map((item) =>
          this.stockService.increaseStock(item.productId, item.quantity),
        ),
      );
    }

    return {
      message: '주문이 취소되었습니다.',
      orderId: order.id,
      refundAmount: order.paymentAmount,
    };
  }
}
