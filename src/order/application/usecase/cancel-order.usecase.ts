import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderService } from '@/order/domain/service/order.service';
import { PointService } from '@/point/domain/service/point.service';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly orderService: OrderService,
    private readonly pointService: PointService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 주문 취소
   *
   * FR-023: 부분 실패 시 실패한 항목 제외하고 결제 금액 재계산 후 환불
   * BR-029: 포인트 즉시 환불
   * BR-030: 쿠폰 복원 조건 (전체 취소 + SHIPPED 전)
   * BR-031: 부분 취소 시 쿠폰 미복원
   * BR-032: 부분 취소 시 취소된 OrderItem의 paymentAmount만 환불
   */
  async execute(orderId: string, userId: string) {
    return this.prisma.$transaction(async () => {
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

      // 3. 포인트 환불 (낙관적 락 재시도 내장)
      // BR-029: 사용한 포인트 즉시 환불
      await this.pointService.refund(userId, order.paymentAmount, orderId);

      // 4. 쿠폰 복원
      // BR-030: 전체 취소 + SHIPPED 전일 때만 복원
      // TODO: 쿠폰 복원 로직 구현
      // const allItemsCancelled = true; // 전체 주문 항목이 취소되었는지 확인
      // if (allItemsCancelled && order.isBeforeShipped() && order.usedCouponId) {
      //   await this.couponService.restore(order.usedCouponId);
      // }

      // 5. TODO: 재고 복원 (optional, 비즈니스 정책에 따라)
      // const orderItems = await this.orderItemService.findOrderItemsByOrderId(orderId);
      // if (order.isPaid()) {
      //   // 결제 완료된 주문인 경우 재고 복원
      //   await Promise.all(
      //     orderItems.map((item) =>
      //       this.stockService.increaseStock(item.productId, item.quantity),
      //     ),
      //   );
      // }

      return {
        message: '주문이 취소되었습니다.',
        orderId: order.id,
        refundAmount: order.paymentAmount,
      };
    });
  }
}
