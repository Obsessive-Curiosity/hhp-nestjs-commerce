export type CreatePromotionProps = {
  paidQuantity: number;
  freeQuantity: number;
  startAt: Date;
  endAt?: Date | null;
};

export type CreatePromotionsProps = CreatePromotionProps[];
