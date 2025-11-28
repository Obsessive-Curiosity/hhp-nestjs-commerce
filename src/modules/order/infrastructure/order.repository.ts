import { Injectable } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/mysql';
import { Order } from '../domain/entity/order.entity';
import {
  IOrderRepository,
  OrderFilterOptions,
} from '../domain/interface/order.repository.interface';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // ID로 주문 존재 여부 확인
  async existsById(id: string): Promise<boolean> {
    const count = await this.em.count(Order, { id });
    return count > 0;
  }

  // ID로 주문 조회
  async findById(id: string): Promise<Order | null> {
    return this.em.findOne(Order, { id });
  }

  // 사용자별 주문 목록 조회
  async findByUserId(
    userId: string,
    filterOptions?: OrderFilterOptions,
  ): Promise<Order[]> {
    const { status } = filterOptions || {};

    const where: FilterQuery<Order> = { userId };
    if (status) {
      where.status = status;
    }

    return this.em.find(Order, where, {
      orderBy: { createdAt: 'DESC' },
    });
  }

  // 모든 주문 조회 (관리자용)
  async findAll(filterOptions?: OrderFilterOptions): Promise<Order[]> {
    const { userId, status } = filterOptions || {};

    const where: FilterQuery<Order> = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    return this.em.find(Order, where, {
      orderBy: { createdAt: 'DESC' },
    });
  }

  // 사용자별 주문 개수 조회
  async countByUserId(
    userId: string,
    filterOptions?: OrderFilterOptions,
  ): Promise<number> {
    const { status } = filterOptions || {};

    const where: FilterQuery<Order> = { userId };
    if (status) {
      where.status = status;
    }

    return this.em.count(Order, where);
  }

  // 전체 주문 개수 조회
  async countAll(filterOptions?: OrderFilterOptions): Promise<number> {
    const { userId, status } = filterOptions || {};

    const where: FilterQuery<Order> = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    return this.em.count(Order, where);
  }

  // ==================== 생성 (Create) ====================

  // 주문 생성
  async create(order: Order): Promise<Order> {
    await this.em.persistAndFlush(order);
    return order;
  }

  // ==================== 수정 (Update) ====================

  // 주문 수정
  async update(order: Order): Promise<Order> {
    await this.em.flush();
    return order;
  }

  // ==================== 삭제 (Delete) ====================

  // 주문 삭제
  async delete(order: Order): Promise<void> {
    await this.em.removeAndFlush(order);
  }
}
