import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { Cart } from '../domain/entity/cart.entity';
import { ICartRepository } from '../domain/interface/cart.repository.interface';

@Injectable()
export class CartRepository implements ICartRepository {
  private readonly logger = new Logger(CartRepository.name);
  private readonly CART_KEY_PREFIX = 'cart:user:';
  private readonly CART_TTL_SECONDS = 30 * 24 * 60 * 60; // 30일

  constructor(private readonly redisService: RedisService) {}

  private getCartKey(userId: string): string {
    return `${this.CART_KEY_PREFIX}${userId}`;
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const redis = this.redisService.getCacheClient();
    const key = this.getCartKey(userId);

    try {
      const data = await redis.hgetall(key);

      // 빈 객체면 장바구니가 없는 것
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      this.logger.debug(`장바구니 조회 완료 - userId: ${userId}`);

      return Cart.fromRedisData(userId, data);
    } catch (error: unknown) {
      this.logger.error(
        `장바구니 조회 실패 - userId: ${userId}, error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async setItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    const redis = this.redisService.getCacheClient();
    const key = this.getCartKey(userId);

    try {
      const pipeline = redis.pipeline();
      pipeline.hset(key, productId, quantity.toString());
      pipeline.expire(key, this.CART_TTL_SECONDS);

      await pipeline.exec();

      this.logger.debug(
        `장바구니 상품 추가/수정 완료 - userId: ${userId}, productId: ${productId}, quantity: ${quantity}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `장바구니 상품 추가/수정 실패 - userId: ${userId}, productId: ${productId}, error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async deleteItem(userId: string, productId: string): Promise<void> {
    const redis = this.redisService.getCacheClient();
    const key = this.getCartKey(userId);

    try {
      const result = await redis.hdel(key, productId);

      if (result === 0) {
        this.logger.warn(
          `삭제할 상품이 장바구니에 없음 - userId: ${userId}, productId: ${productId}`,
        );
      } else {
        this.logger.debug(
          `장바구니 상품 삭제 완료 - userId: ${userId}, productId: ${productId}`,
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        `장바구니 상품 삭제 실패 - userId: ${userId}, productId: ${productId}, error: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async delete(userId: string): Promise<void> {
    const redis = this.redisService.getCacheClient();
    const key = this.getCartKey(userId);

    try {
      await redis.del(key);
      this.logger.debug(`장바구니 전체 삭제 완료 - userId: ${userId}`);
    } catch (error: unknown) {
      this.logger.error(
        `장바구니 전체 삭제 실패 - userId: ${userId}, error: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
