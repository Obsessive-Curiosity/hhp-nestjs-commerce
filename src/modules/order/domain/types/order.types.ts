export type CreateOrderProps = {
  userId: string;
  usedCouponId?: string | null;
  basePrice: number;
  discountAmount: number;
  paymentAmount: number;
  recipientName: string;
  phone: string;
  zipCode: string;
  address: string;
  addressDetail: string;
  deliveryRequest?: string | null;
};
