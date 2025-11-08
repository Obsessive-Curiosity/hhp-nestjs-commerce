import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Order as PrismaOrder } from '@prisma/client';
import { Order } from '../domain/entity/order.entity';
import {
  IOrderRepository,
  OrderFilterOptions,
  OrderIncludeOptions,
  OrderPaginationOptions,
} from '../domain/interface/order.repository.interface';
import { assignDirtyFields } from '@/common/utils/repository.utils';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  // read: DB → Entity
  private toDomain(row: PrismaOrder): Order {
    return new Order({
      id: row.id,
      userId: row.userId,
      status: row.status,
      usedCouponId: row.usedCouponId,
      basePrice: row.basePrice,
      discountAmount: row.discountAmount,
      paymentAmount: row.paymentAmount,
      recipientName: row.recipientName,
      phone: row.phone,
      zipCode: row.zipCode,
      address: row.address,
      addressDetail: row.addressDetail,
      deliveryRequest: row.deliveryRequest,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  // write: Entity → DB
  private fromDomain(order: Order) {
    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      usedCouponId: order.usedCouponId,
      basePrice: order.basePrice,
      discountAmount: order.discountAmount,
      paymentAmount: order.paymentAmount,
      recipientName: order.recipientName,
      phone: order.phone,
      zipCode: order.zipCode,
      address: order.address,
      addressDetail: order.addressDetail,
      deliveryRequest: order.deliveryRequest,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  // Include 옵션을 Prisma include로 변환
  private buildIncludeOptions(options?: OrderIncludeOptions) {
    if (!options) return undefined;

    return {
      orderItems: options.includeOrderItems ?? false,
    };
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.order.count({
      where: { id },
    });

    return count > 0;
  }

  async findById(
    id: string,
    options?: OrderIncludeOptions,
  ): Promise<Order | null> {
    const orderData = await this.prisma.order.findUnique({
      where: { id },
      include: this.buildIncludeOptions(options),
    });

    return orderData ? this.toDomain(orderData) : null;
  }

  async findByUserId(
    userId: string,
    filterOptions?: OrderFilterOptions,
    paginationOptions?: OrderPaginationOptions,
    includeOptions?: OrderIncludeOptions,
  ): Promise<Order[]> {
    const { status } = filterOptions || {};
    const { page = 1, limit = 10 } = paginationOptions || {};

    const where: {
      userId: string;
      status?: typeof status;
    } = { userId };

    if (status) {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: this.buildIncludeOptions(includeOptions),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return orders.map((o) => this.toDomain(o));
  }

  async findAll(
    filterOptions?: OrderFilterOptions,
    paginationOptions?: OrderPaginationOptions,
    includeOptions?: OrderIncludeOptions,
  ): Promise<Order[]> {
    const { userId, status } = filterOptions || {};
    const { page = 1, limit = 10 } = paginationOptions || {};

    const where: {
      userId?: string;
      status?: typeof status;
    } = {};

    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: this.buildIncludeOptions(includeOptions),
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return orders.map((o) => this.toDomain(o));
  }

  async create(order: Order): Promise<Order> {
    const data = this.fromDomain(order);

    const newOrder = await this.prisma.order.create({
      data,
    });

    return this.toDomain(newOrder);
  }

  async update(order: Order): Promise<Order> {
    const dirtyFields = order.getDirtyFields();

    // 변경된 필드가 없으면 스킵
    if (dirtyFields.size === 0) {
      return order;
    }

    // 변경된 필드만 추출
    const fullData = this.fromDomain(order);
    const updateData: Partial<PrismaOrder> = {};

    assignDirtyFields(fullData, updateData, [
      ...dirtyFields,
    ] as (keyof PrismaOrder)[]);

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    const result = this.toDomain(updatedOrder);
    result.clearDirtyFields();

    return result;
  }

  async delete(orderId: string): Promise<void> {
    await this.prisma.order.delete({
      where: { id: orderId },
    });
  }

  async countByUserId(
    userId: string,
    filterOptions?: OrderFilterOptions,
  ): Promise<number> {
    const { status } = filterOptions || {};

    const where: {
      userId: string;
      status?: typeof status;
    } = { userId };

    if (status) {
      where.status = status;
    }

    return this.prisma.order.count({ where });
  }

  async countAll(filterOptions?: OrderFilterOptions): Promise<number> {
    const { userId, status } = filterOptions || {};

    const where: {
      userId?: string;
      status?: typeof status;
    } = {};

    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.order.count({ where });
  }
}
