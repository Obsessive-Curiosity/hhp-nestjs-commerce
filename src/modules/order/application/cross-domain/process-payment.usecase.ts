import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderProps } from '@/modules/order/domain/types';
import { CreateOrderTransaction } from '../in-domain/create-order.transaction';
import { CompletePaymentTransaction } from './complete-payment.transaction';
import { DeleteOrderRollback } from '../in-domain/delete-order.rollback';
import { ProductService } from '@/modules/product/domain/service/product.service';
import { AddressService } from '@/modules/user/domain/service/address.service';
import { CouponService } from '@/modules/coupon/domain/service/coupon.service';
import { CreateOrderDto } from '@/modules/order/presentation/dto';
import { Payload } from '@/common/types/express';
import { ProductWithDetails } from '@/modules/product/domain/interface/product.repository.interface';
import { getRolePermissions } from '@/modules/product/domain/utils/role-permissions.utils';
import { DeductStockTransaction } from '@/modules/product/application/in-domain/deduct-stock.transaction';
import { RestoreStockTransaction } from '@/modules/product/application/in-domain/restore-stock.transaction';
import { CartService } from '@/modules/cart/domain/service/cart.service';

@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    private readonly productService: ProductService,
    private readonly addressService: AddressService,
    private readonly couponService: CouponService,
    private readonly cartService: CartService,
    private readonly createOrderTransaction: CreateOrderTransaction,
    private readonly deductStockTransaction: DeductStockTransaction,
    private readonly restoreStockTransaction: RestoreStockTransaction,
    private readonly completePaymentTransaction: CompletePaymentTransaction,
    private readonly deleteOrderRollback: DeleteOrderRollback,
  ) {}

  async execute(user: Payload, dto: CreateOrderDto) {
    const { sub: userId, role: userRole } = user;
    const { items, couponId, deliveryRequest } = dto;

    // ==================== 1. 검증 단계 (트랜잭션 없음) ====================

    // 1-1. 상품 존재 및 활성화 검증
    const productsData = await Promise.all(
      items.map((item) =>
        this.productService.findProductWithDetails(item.productId, userRole),
      ),
    );

    // 1-2. 삭제된 상품 체크 및 유효한 상품 필터링
    const { validProducts: products, inactiveProductIds } =
      this.separateDeletedProducts(items, productsData);

    if (inactiveProductIds.length > 0) {
      throw new NotFoundException({
        code: 'PRODUCTS_NOT_FOUND',
        inactiveProductIds,
      });
    }

    // 1-3. 기본 배송지 조회
    const defaultAddress = await this.addressService.getDefaultAddress(userId);

    if (!defaultAddress) {
      throw new NotFoundException('기본 배송지가 설정되어 있지 않습니다.');
    }

    const address = defaultAddress;

    // 1-4. 주문 항목별 금액 계산
    const calculatedItems = items.map((item, index) => {
      const product = products[index];

      const unitPrice = product.price; // 상품 단가
      const quantity = item.quantity; // 주문 수량
      const baseAmount = unitPrice * quantity;

      // 항목별 할인 없음
      const discountAmount = 0;
      const paymentAmount = baseAmount;

      return {
        productId: item.productId,
        quantity,
        unitPrice,
        discountAmount,
        paymentAmount,
      };
    });

    // 1-4. 주문 전체 금액 계산
    const basePrice = calculatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // 1-5. 쿠폰 할인 계산 (B2C만)
    const { isB2C } = getRolePermissions(userRole);

    let couponDiscount = 0;
    if (isB2C && couponId) {
      couponDiscount = await this.couponService.applyCouponDiscount(
        couponId,
        basePrice,
      );
    }

    const totalDiscount = couponDiscount;
    const paymentAmount = basePrice - totalDiscount;

    // ==================== 2. Order 생성 (트랜잭션) ====================

    const orderData: CreateOrderProps = {
      userId,
      usedCouponId: couponId,
      basePrice,
      discountAmount: totalDiscount,
      paymentAmount,
      recipientName: address.recipientName,
      phone: address.phone,
      zipCode: address.zipCode,
      address: address.getOrderAddress(),
      addressDetail: address.detail,
      deliveryRequest: deliveryRequest ?? null,
    };

    const { order, orderItems: createdOrderItems } =
      await this.createOrderTransaction.execute({
        orderData,
        orderItems: calculatedItems,
      });

    // ==================== 3. 재고 차감 (트랜잭션 + 보상 트랜잭션) ====================
    const deductItems = createdOrderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    try {
      await this.deductStockTransaction.execute({ items: deductItems });
    } catch (error) {
      // 보상 트랜잭션: 재고 차감 실패 시 생성된 주문 삭제
      await this.deleteOrderRollback.execute(order);
      throw error;
    }

    // ==================== 4. 결제 처리 (지갑 + 쿠폰 + 상태 변경 = 하나의 트랜잭션) ====================
    try {
      await this.completePaymentTransaction.execute({
        userId,
        amount: paymentAmount,
        orderId: order.id,
        userCouponId: couponId,
      });
    } catch (error) {
      // 보상 트랜잭션: 재고 복구 + 주문 삭제
      await this.restoreStockTransaction.execute({ items: deductItems });
      await this.deleteOrderRollback.execute(order);
      throw error;
    }

    // ==================== 5. 장바구니 비우기 (Redis) ====================
    await this.cartService.clearCart(userId);

    return {
      message: '주문이 완료되었습니다.',
      order,
      orderItems: createdOrderItems,
    };
  }

  // ==================== Private Methods ====================

  /**
   * 상품 데이터를 유효한 상품과 삭제된 상품 ID로 분리
   */
  private separateDeletedProducts(
    items: Array<{ productId: string }>,
    productsData: (ProductWithDetails | null)[],
  ): { validProducts: ProductWithDetails[]; inactiveProductIds: string[] } {
    return productsData.reduce(
      (acc, product, index) => {
        if (product === null) {
          acc.inactiveProductIds.push(items[index].productId);
        } else {
          acc.validProducts.push(product);
        }
        return acc;
      },
      {
        validProducts: [] as ProductWithDetails[],
        inactiveProductIds: [] as string[],
      },
    );
  }
}
