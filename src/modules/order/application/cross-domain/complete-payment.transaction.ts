import { Injectable } from '@nestjs/common';
import { Transactional } from '@mikro-orm/core';
import { WalletService } from '@/modules/wallet/domain/service/wallet.service';
import { WalletHistoryService } from '@/modules/wallet/domain/service/wallet-history.service';
import { UserCouponService } from '@/modules/coupon/domain/service/user-coupon.service';
import { OrderService } from '@/modules/order/domain/service/order.service';

export interface CompletePaymentParams {
  userId: string;
  amount: number;
  orderId: string;
  userCouponId?: string; // optional - B2C 쿠폰 사용 시에만
}

@Injectable()
export class CompletePaymentTransaction {
  constructor(
    private readonly walletService: WalletService,
    private readonly walletHistoryService: WalletHistoryService,
    private readonly userCouponService: UserCouponService,
    private readonly orderService: OrderService,
  ) {}

  @Transactional()
  async execute(params: CompletePaymentParams): Promise<void> {
    const { userId, amount, orderId, userCouponId } = params;

    // 1. 지갑 차감 (낙관적 락 사용 - version 체크)
    const newWallet = await this.walletService.use(userId, amount);

    // 2. 지갑 히스토리 기록 (USE 타입)
    await this.walletHistoryService.recordUse(
      userId,
      amount,
      newWallet.balance,
      orderId,
    );

    // 3. 쿠폰 사용 처리 (couponId가 있을 때만)
    if (userCouponId) {
      await this.userCouponService.useCoupon(userCouponId);
    }

    // 4. 주문 상태 PAID로 변경
    await this.orderService.markOrderAsPaid(orderId);
  }
}
