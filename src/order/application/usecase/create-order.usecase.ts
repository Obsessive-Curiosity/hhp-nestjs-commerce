import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderService } from '@/order/domain/service/order.service';
import { OrderItemService } from '@/order/domain/service/order-item.service';
import { OrderCalculationService } from '@/order/domain/service/order-calculation.service';
import { ProductService } from '@/product/domain/service/product.service';
import { StockService } from '@/product/domain/service/stock.service';
import { PointService } from '@/point/domain/service/point.service';
import { StockExclusionPolicy } from '@/order/domain/policy/stock-exclusion.policy';
import { Role } from '@prisma/client';

interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

export interface CreateOrderInput {
  userId: string;
  userRole: Role;
  items: CreateOrderItemInput[];
  couponIds?: string[];
  deliveryRequest?: string;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderItemService: OrderItemService,
    private readonly orderCalculationService: OrderCalculationService,
    private readonly productService: ProductService,
    private readonly stockService: StockService,
    private readonly pointService: PointService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 주문 생성
   *
   * FR-013: 재고 확인
   * FR-014: 재고 부족 시 전체 실패 (자동 제외 옵션)
   * FR-015: 고유 주문번호 생성
   * BR-020: 모든 상품 재고 확인
   * BR-021: 재고 부족 상품 자동 제외 (사용자 설정에 따라)
   * BR-022: 재고 부족 상품 제외 시 금액 재계산
   */
  async execute(input: CreateOrderInput) {
    // 1. 상품 존재 및 활성화 검증
    const productIds = input.items.map((item) => item.productId);
    const productsData = await Promise.all(
      productIds.map((id) =>
        this.productService.findProductById(id, {
          sub: input.userId,
          role: input.userRole,
        }),
      ),
    );

    // 삭제된 상품 체크
    const inactiveProducts = productsData.filter(
      (p) => p === null || p.isDeleted(),
    );
    if (inactiveProducts.length > 0) {
      throw new BadRequestException(
        '삭제되었거나 존재하지 않는 상품이 포함되어 있습니다.',
      );
    }

    const products = productsData.filter((p) => p !== null);

    // 2. 재고 확인 및 부족 상품 자동 제외
    const stockChecks = await Promise.all(
      input.items.map(async (item) => {
        const hasStock = await this.stockService.checkStock(
          item.productId,
          item.quantity,
        );
        return { productId: item.productId, hasStock };
      }),
    );

    // 재고 부족 상품 자동 제외 정책 적용
    const { includedItems: finalItems, excludedProductIds } =
      StockExclusionPolicy.excludeOutOfStockItems(input.items, stockChecks);

    // 3. User의 기본 배송지 조회
    const shippingAddress = await this.prisma.shippingAddress.findFirst({
      where: { userId: input.userId, default: true },
    });

    if (!shippingAddress) {
      throw new NotFoundException('기본 배송지가 설정되어 있지 않습니다.');
    }

    // 4. 가격 계산 준비 (B2B/B2C에 따른 가격)
    const { isB2B, isB2C } = this.productService.getRolePermissions(
      input.userRole,
    );

    const itemCalculationInputs = finalItems.map((item) => {
      const product = products.find((p) => p?.id === item.productId);
      if (!product) {
        throw new NotFoundException(
          `상품 ID ${item.productId}를 찾을 수 없습니다.`,
        );
      }

      // B2B는 wholesalePrice, B2C는 retailPrice
      let basePrice = 0;
      if (isB2B && product.wholesalePrice) {
        basePrice = product.wholesalePrice;
      } else if (isB2C && product.retailPrice) {
        basePrice = product.retailPrice;
      } else {
        throw new BadRequestException(
          `상품 ${product.name}의 가격 정보가 없습니다.`,
        );
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
        basePrice,
        // TODO: 프로모션 할인 적용 (B2B 전용)
        promotionDiscount: 0,
        // TODO: 아이템 쿠폰 할인 적용
        itemCouponDiscount: 0,
      };
    });

    // 5. 주문 금액 계산
    // TODO: 주문별 쿠폰 할인 적용
    const orderCouponDiscountTotal = 0;

    const calculation = this.orderCalculationService.calculateOrder(
      itemCalculationInputs,
      orderCouponDiscountTotal,
    );

    // 6. 포인트 잔액 확인
    const point = await this.pointService.getOrCreatePoint(input.userId);
    if (!point.hasSufficientBalance(calculation.paymentAmount)) {
      throw new BadRequestException(
        `포인트 잔액이 부족합니다. (잔액: ${point.amount}, 필요: ${calculation.paymentAmount})`,
      );
    }

    // 7. 주문 생성 (PENDING 상태)
    const order = await this.orderService.createOrder({
      userId: input.userId,
      usedCouponId: null, // TODO: 주문별 쿠폰 ID
      basePrice: calculation.basePrice,
      discountAmount: calculation.totalDiscount,
      paymentAmount: calculation.paymentAmount,
      recipientName: shippingAddress.recipientName,
      phone: shippingAddress.phone,
      zipCode: shippingAddress.zipCode,
      address: shippingAddress.address,
      addressDetail: shippingAddress.addressDetail,
      deliveryRequest: input.deliveryRequest ?? null,
    });

    // 8. 주문 항목 생성
    const orderItemParams = calculation.items.map((item) => ({
      orderId: order.id,
      productId: item.productId,
      usedItemCouponId: null, // TODO: 아이템별 쿠폰 ID
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.totalDiscount,
      paymentAmount: item.paymentAmount,
    }));

    const orderItems =
      await this.orderItemService.createOrderItems(orderItemParams);

    return {
      order,
      orderItems,
      excludedProducts:
        excludedProductIds.length > 0 ? excludedProductIds : undefined,
    };
  }
}
