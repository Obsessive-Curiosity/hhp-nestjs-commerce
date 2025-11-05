import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@prisma/client';
import { ProductFacadeService } from '@/product/application/product.facade';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreatePromotionsDto } from '../dto/create-promotion.dto';

@RBAC([Role.ADMIN])
@Controller('/admin/product')
export class ProductAdminController {
  constructor(private readonly productFacade: ProductFacadeService) {}

  /**
   * 상품 생성
   */
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productFacade.createProduct(createProductDto);
  }

  /**
   * 상품 수정 (재고 제외)
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productFacade.updateProduct(id, updateProductDto);
  }

  /**
   * 재고 증가 (입고)
   */
  @Post(':id/stock/increase')
  increaseStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; reason?: string },
  ) {
    return this.productFacade.increaseStock(id, body.quantity, body.reason);
  }

  /**
   * 재고 감소 (폐기/분실 등)
   */
  @Post(':id/stock/decrease')
  decreaseStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; reason?: string },
  ) {
    return this.productFacade.decreaseStock(id, body.quantity, body.reason);
  }

  /**
   * 상품 프로모션 생성
   */
  @Post(':id/promotion')
  createPromotion(
    @Param('id') id: string,
    @Body() createPromotionDto: CreatePromotionsDto,
  ) {
    return this.productFacade.createPromotions(id, createPromotionDto);
  }

  /**
   * 상품 프로모션 삭제
   */
  @Delete('promotion/:id')
  deletePromotion(@Param('id') id: string) {
    return this.productFacade.deletePromotion(id);
  }
}
