import { Injectable } from '@nestjs/common';

export interface OrderItemCalculationInput {
  productId: string;
  quantity: number;
  basePrice: number; // 기본 단가 (B2B/B2C에 따라 wholesale/retail)
  promotionDiscount?: number; // 프로모션 할인 (B2B 전용)
  itemCouponDiscount?: number; // 아이템 쿠폰 할인
}

export interface OrderItemCalculationResult {
  productId: string;
  quantity: number;
  unitPrice: number; // 실제 판매 단가
  baseAmount: number; // 기본 금액 (unitPrice * quantity)
  promotionDiscount: number; // 프로모션 할인
  itemCouponDiscount: number; // 아이템별 쿠폰 할인
  orderCouponDiscount: number; // 주문별 쿠폰 할인 (분배됨)
  totalDiscount: number; // 총 할인 금액
  paymentAmount: number; // 최종 결제 금액
}

export interface OrderCalculationResult {
  items: OrderItemCalculationResult[];
  basePrice: number; // 전체 기본 금액
  totalDiscount: number; // 전체 할인 금액
  paymentAmount: number; // 최종 결제 금액
}

/**
 * 주문 금액 계산 서비스
 *
 * BR-023: 주문별 쿠폰 1개 + 아이템별 쿠폰 각 1개
 * BR-024: 주문별 쿠폰 할인은 (basePrice - promotionDiscount - itemCouponDiscount) 비율로 분배
 * BR-049: 할인 적용 순서: 프로모션 → 아이템 쿠폰 → 주문 쿠폰
 * BR-050: 주문별 쿠폰은 (상품금액 - 프로모션 - 아이템쿠폰) 기준으로 분배
 * BR-051: 분배 시 내림, 나머지는 마지막 OrderItem에 합산
 */
@Injectable()
export class OrderCalculationService {
  /**
   * 주문 항목별 금액 계산 (주문별 쿠폰 제외)
   */
  calculateOrderItem(
    input: OrderItemCalculationInput,
  ): Omit<
    OrderItemCalculationResult,
    'orderCouponDiscount' | 'totalDiscount' | 'paymentAmount'
  > {
    const baseAmount = input.basePrice * input.quantity;
    const promotionDiscount = input.promotionDiscount ?? 0;
    const itemCouponDiscount = input.itemCouponDiscount ?? 0;

    // 할인 금액이 기본 금액을 초과하지 않도록 검증
    if (promotionDiscount + itemCouponDiscount > baseAmount) {
      throw new Error(
        `할인 금액이 기본 금액을 초과할 수 없습니다. (기본: ${baseAmount}, 할인: ${promotionDiscount + itemCouponDiscount})`,
      );
    }

    return {
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: input.basePrice,
      baseAmount,
      promotionDiscount,
      itemCouponDiscount,
    };
  }

  /**
   * 주문별 쿠폰 할인을 각 OrderItem에 비율 분배
   *
   * BR-024: (baseAmount - promotionDiscount - itemCouponDiscount) 비율로 분배
   * BR-051: 내림 처리, 나머지는 마지막 OrderItem에 합산
   */
  distributeOrderCouponDiscount(
    items: Omit<
      OrderItemCalculationResult,
      'orderCouponDiscount' | 'totalDiscount' | 'paymentAmount'
    >[],
    orderCouponDiscountTotal: number,
  ): OrderItemCalculationResult[] {
    if (items.length === 0) {
      throw new Error('주문 항목이 없습니다.');
    }

    if (orderCouponDiscountTotal < 0) {
      throw new Error('주문별 쿠폰 할인 금액은 0 이상이어야 합니다.');
    }

    // 주문별 쿠폰이 없는 경우
    if (orderCouponDiscountTotal === 0) {
      return items.map((item) => ({
        ...item,
        orderCouponDiscount: 0,
        totalDiscount: item.promotionDiscount + item.itemCouponDiscount,
        paymentAmount:
          item.baseAmount - item.promotionDiscount - item.itemCouponDiscount,
      }));
    }

    // 각 아이템의 분배 기준 금액 계산 (baseAmount - promotionDiscount - itemCouponDiscount)
    const distributionBases = items.map(
      (item) =>
        item.baseAmount - item.promotionDiscount - item.itemCouponDiscount,
    );

    const totalDistributionBase = distributionBases.reduce(
      (sum, base) => sum + base,
      0,
    );

    if (totalDistributionBase <= 0) {
      throw new Error('주문별 쿠폰 할인을 적용할 금액이 없습니다.');
    }

    if (orderCouponDiscountTotal > totalDistributionBase) {
      throw new Error(
        `주문별 쿠폰 할인 금액이 적용 가능한 금액을 초과합니다. (적용 가능: ${totalDistributionBase}, 할인: ${orderCouponDiscountTotal})`,
      );
    }

    // 각 아이템별 할인 금액 분배 (내림)
    const distributedDiscounts = distributionBases.map((base) =>
      Math.floor((base / totalDistributionBase) * orderCouponDiscountTotal),
    );

    // 내림으로 인한 나머지 계산
    const distributedTotal = distributedDiscounts.reduce(
      (sum, discount) => sum + discount,
      0,
    );
    const remainder = orderCouponDiscountTotal - distributedTotal;

    // 나머지를 마지막 아이템에 합산
    if (remainder > 0) {
      distributedDiscounts[distributedDiscounts.length - 1] += remainder;
    }

    // 최종 결과 생성
    return items.map((item, index) => {
      const orderCouponDiscount = distributedDiscounts[index];
      const totalDiscount =
        item.promotionDiscount + item.itemCouponDiscount + orderCouponDiscount;
      const paymentAmount = item.baseAmount - totalDiscount;

      return {
        ...item,
        orderCouponDiscount,
        totalDiscount,
        paymentAmount,
      };
    });
  }

  /**
   * 전체 주문 금액 계산
   */
  calculateOrder(
    itemInputs: OrderItemCalculationInput[],
    orderCouponDiscountTotal: number = 0,
  ): OrderCalculationResult {
    if (itemInputs.length === 0) {
      return {
        items: [],
        basePrice: 0,
        totalDiscount: 0,
        paymentAmount: 0,
      };
    }

    // 각 아이템별 계산 (주문 쿠폰 제외)
    const itemsWithoutOrderCoupon = itemInputs.map((input) =>
      this.calculateOrderItem(input),
    );

    // 주문별 쿠폰 할인 분배
    const items = this.distributeOrderCouponDiscount(
      itemsWithoutOrderCoupon,
      orderCouponDiscountTotal,
    );

    // 전체 금액 계산
    const basePrice = items.reduce((sum, item) => sum + item.baseAmount, 0);
    const totalDiscount = items.reduce(
      (sum, item) => sum + item.totalDiscount,
      0,
    );
    const paymentAmount = items.reduce(
      (sum, item) => sum + item.paymentAmount,
      0,
    );

    return {
      items,
      basePrice,
      totalDiscount,
      paymentAmount,
    };
  }

  /**
   * 재고 부족 시 일부 아이템 제외 후 재계산
   *
   * BR-022: 재고 부족 아이템 제외 시 나머지 아이템으로 재계산
   * BR-052: 제외 후 주문 금액이 최소 구매 금액 미달 시 쿠폰 미적용
   */
  recalculateWithExcludedItems(
    originalItems: OrderItemCalculationInput[],
    excludedProductIds: string[],
    orderCouponDiscountTotal: number = 0,
    minimumPurchaseAmount?: number,
  ): OrderCalculationResult {
    // 재고 부족 아이템 제외
    const remainingItems = originalItems.filter(
      (item) => !excludedProductIds.includes(item.productId),
    );

    if (remainingItems.length === 0) {
      throw new Error('재고 부족으로 주문 가능한 상품이 없습니다.');
    }

    // 최소 구매 금액 체크
    if (minimumPurchaseAmount !== undefined) {
      const baseAmount = remainingItems.reduce(
        (sum, item) => sum + item.basePrice * item.quantity,
        0,
      );

      // BR-052: 최소 구매 금액 미달 시 주문 쿠폰 미적용
      if (baseAmount < minimumPurchaseAmount) {
        return this.calculateOrder(remainingItems, 0);
      }
    }

    return this.calculateOrder(remainingItems, orderCouponDiscountTotal);
  }
}
