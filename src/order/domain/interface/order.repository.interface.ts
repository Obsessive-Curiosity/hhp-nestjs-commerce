import { Order, OrderStatus } from '../entity/order.entity';

export interface OrderFilterOptions {
  userId?: string;
  status?: OrderStatus;
}

export interface OrderPaginationOptions {
  page?: number;
  limit?: number;
}

export interface IOrderRepository {
  // 주문 존재 여부 확인
  existsById(id: string): Promise<boolean>;

  // ID로 주문 조회
  findById(id: string): Promise<Order | null>;

  // 사용자별 주문 목록 조회
  findByUserId(
    userId: string,
    filterOptions?: OrderFilterOptions,
    paginationOptions?: OrderPaginationOptions,
  ): Promise<Order[]>;

  // 모든 주문 조회 (관리자용)
  findAll(
    filterOptions?: OrderFilterOptions,
    paginationOptions?: OrderPaginationOptions,
  ): Promise<Order[]>;

  // 주문 생성
  create(order: Order): Promise<Order>;

  // 주문 업데이트
  update(order: Order): Promise<Order>;

  // 주문 삭제 (물리 삭제 - 실제 사용은 거의 없음)
  delete(order: Order): Promise<void>;

  // 사용자별 주문 총 개수 조회
  countByUserId(
    userId: string,
    filterOptions?: OrderFilterOptions,
  ): Promise<number>;

  // 전체 주문 총 개수 조회 (관리자용)
  countAll(filterOptions?: OrderFilterOptions): Promise<number>;
}

// Repository 의존성 주입을 위한 토큰
export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
