import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OrderItem as PrismaOrderItem } from '@prisma/client';
import { OrderItem } from '../domain/entity/order-item.entity';
import { IOrderItemRepository } from '../domain/interface/order-item.repository.interface';
import { assignDirtyFields } from '@/common/utils/repository.utils';

@Injectable()
export class OrderItemRepository implements IOrderItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaOrderItem): OrderItem {
    return new OrderItem({
      id: row.id,
      orderId: row.orderId,
      productId: row.productId,
      usedItemCouponId: row.usedItemCouponId,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      discountAmount: row.discountAmount,
      paymentAmount: row.paymentAmount,
      claimStatus: row.claimStatus,
      createdAt: row.createdAt,
    });
  }

  // write: Entity → DB
  private fromDomain(orderItem: OrderItem) {
    return {
      id: orderItem.id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      usedItemCouponId: orderItem.usedItemCouponId,
      quantity: orderItem.quantity,
      unitPrice: orderItem.unitPrice,
      discountAmount: orderItem.discountAmount,
      paymentAmount: orderItem.paymentAmount,
      claimStatus: orderItem.claimStatus,
      createdAt: orderItem.createdAt,
    };
  }

  async findById(id: string): Promise<OrderItem | null> {
    const orderItemData = await this.prisma.orderItem.findUnique({
      where: { id },
    });

    return orderItemData ? this.toDomain(orderItemData) : null;
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return orderItems.map((item) => this.toDomain(item));
  }

  async findByProductId(productId: string): Promise<OrderItem[]> {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return orderItems.map((item) => this.toDomain(item));
  }

  async create(orderItem: OrderItem): Promise<OrderItem> {
    const data = this.fromDomain(orderItem);

    const newOrderItem = await this.prisma.orderItem.create({
      data,
    });

    return this.toDomain(newOrderItem);
  }

  async createMany(orderItems: OrderItem[]): Promise<OrderItem[]> {
    const data = orderItems.map((item) => this.fromDomain(item));

    await this.prisma.orderItem.createMany({
      data,
    });

    // createMany는 생성된 레코드를 반환하지 않으므로, 다시 조회
    // 단, 이는 성능상 비효율적일 수 있으므로, 필요시 개선 가능
    const orderIds = [...new Set(orderItems.map((item) => item.orderId))];
    if (orderIds.length === 1) {
      return this.findByOrderId(orderIds[0]);
    }

    // 여러 주문의 아이템인 경우 (일반적이지 않음)
    return orderItems;
  }

  async update(orderItem: OrderItem): Promise<OrderItem> {
    const dirtyFields = orderItem.getDirtyFields();

    // 변경된 필드가 없으면 스킵
    if (dirtyFields.size === 0) {
      return orderItem;
    }

    // 변경된 필드만 추출
    const fullData = this.fromDomain(orderItem);
    const updateData: Partial<PrismaOrderItem> = {};

    assignDirtyFields(fullData, updateData, [
      ...dirtyFields,
    ] as (keyof PrismaOrderItem)[]);

    const updatedOrderItem = await this.prisma.orderItem.update({
      where: { id: orderItem.id },
      data: updateData,
    });

    const result = this.toDomain(updatedOrderItem);
    result.clearDirtyFields();

    return result;
  }

  async delete(orderItemId: string): Promise<void> {
    await this.prisma.orderItem.delete({
      where: { id: orderItemId },
    });
  }

  async countByOrderId(orderId: string): Promise<number> {
    return this.prisma.orderItem.count({
      where: { orderId },
    });
  }
}
