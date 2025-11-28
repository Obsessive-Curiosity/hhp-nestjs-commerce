import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { Role } from '@/modules/user/domain/entity/user.entity';
import { RBAC } from '@/modules/auth/decorators/rbac.decorator';
import { UserInfo } from '@/modules/user/presentation/decorators/user-info.decorator';
import { Payload } from '@/common/types/express';
import { CartFacade } from '../../application/cart.facade';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('cart')
export class CartController {
  constructor(private readonly cartFacade: CartFacade) {}

  /**
   * 장바구니 조회
   * GET /cart
   */
  @Get()
  async getCart(@UserInfo() user: Payload) {
    return this.cartFacade.getCart(user);
  }

  /**
   * 장바구니에 상품 추가
   * POST /cart/items
   */
  @Post('items')
  async addItem(@UserInfo() user: Payload, @Body() dto: AddCartItemDto) {
    await this.cartFacade.addItem(user.sub, dto);
    return {
      message: '장바구니에 상품이 추가되었습니다.',
    };
  }

  /**
   * 장바구니 상품 수량 수정
   * PATCH /cart/items/:productId
   */
  @Patch('items/:productId')
  async updateItem(
    @UserInfo() user: Payload,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    await this.cartFacade.updateItem(user.sub, productId, dto);
    return {
      message: '장바구니 상품 수량이 수정되었습니다.',
    };
  }

  /**
   * 장바구니에서 상품 제거
   * DELETE /cart/items/:productId
   */
  @Delete('items/:productId')
  async removeItem(
    @UserInfo() user: Payload,
    @Param('productId') productId: string,
  ) {
    await this.cartFacade.removeItem(user.sub, productId);
    return {
      message: '장바구니에서 상품이 제거되었습니다.',
    };
  }

  /**
   * 장바구니 비우기
   * DELETE /cart
   */
  @Delete()
  async clearCart(@UserInfo() user: Payload) {
    await this.cartFacade.clearCart(user.sub);
    return {
      message: '장바구니가 비워졌습니다.',
    };
  }
}
