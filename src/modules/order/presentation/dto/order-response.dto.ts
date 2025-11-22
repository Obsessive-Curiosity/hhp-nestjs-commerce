import { OrderStatus } from '@/modules/order/domain/entity/order.entity';
import { OrderItemClaimStatus } from '@/modules/order/domain/entity/order-item.entity';

export class OrderItemResponseDto {
  id: string;
  orderId: string;
  productId: string;
  usedItemCouponId: string | null;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  paymentAmount: number;
  claimStatus: OrderItemClaimStatus | null;
  createdAt: Date;
}

export class OrderResponseDto {
  id: string;
  userId: string;
  status: OrderStatus;
  usedCouponId: string | null;
  basePrice: number;
  discountAmount: number;
  paymentAmount: number;
  recipientName: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  deliveryRequest: string | null;
  createdAt: Date;
  updatedAt: Date;
  orderItems?: OrderItemResponseDto[];
}

export class CreateOrderResponseDto {
  order: OrderResponseDto;
  orderItems: OrderItemResponseDto[];
  excludedProducts?: string[];
}

export class OrderListResponseDto {
  orders: OrderResponseDto[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

export class PaymentResponseDto {
  message: string;
  orderId: string;
  paymentAmount: number;
}

export class CancelOrderResponseDto {
  message: string;
  orderId: string;
  refundAmount: number;
}
