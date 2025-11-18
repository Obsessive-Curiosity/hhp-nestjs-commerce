import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { Role } from '@/user/domain/entity/user.entity';
import { ProductFacade } from '@/product/application/product.facade';
import { CreateProductUsecase } from '@/product/application/in-domain/create-product.usecase';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { CreatePromotionsDto } from '../dto/create-promotion.dto';

@RBAC([Role.ADMIN])
@Controller('/admin/product')
export class ProductAdminController {
  constructor(
    private readonly productFacade: ProductFacade,
    private readonly createProductUsecase: CreateProductUsecase,
  ) {}

  /**
   * 상품 생성
   * POST /admin/product
   */
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.createProductUsecase.execute({
      categoryId: createProductDto.categoryId,
      name: createProductDto.name,
      retailPrice: createProductDto.retailPrice,
      wholesalePrice: createProductDto.wholesalePrice,
      description: createProductDto.description,
      imageUrl: createProductDto.imageUrl,
      stock: createProductDto.stock,
    });
  }

  /**
   * 상품 수정 (재고 제외)
   * PATCH /admin/product/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productFacade.updateProduct(id, {
      name: updateProductDto.name,
      categoryId: updateProductDto.categoryId,
      retailPrice: updateProductDto.retailPrice,
      wholesalePrice: updateProductDto.wholesalePrice,
      description: updateProductDto.description,
      imageUrl: updateProductDto.imageUrl,
    });
  }

  /**
   * 재고 증가 (입고)
   * POST /admin/product/:id/stock/increase
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
   * POST /admin/product/:id/stock/decrease
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
   * POST /admin/product/:id/promotion
   */
  @Post(':id/promotion')
  createPromotion(
    @Param('id') id: string,
    @Body() createPromotionDto: CreatePromotionsDto,
  ) {
    return this.productFacade.createPromotions(
      id,
      createPromotionDto.map((item) => ({
        paidQuantity: item.paidQuantity,
        freeQuantity: item.freeQuantity,
        startAt: item.startAt ?? new Date(),
        endAt: item.endAt,
      })),
    );
  }

  /**
   * 상품 프로모션 삭제
   * DELETE /admin/product/promotion/:promotionId
   */
  @Delete('promotion/:id')
  deletePromotion(@Param('id') id: string) {
    return this.productFacade.deletePromotion(id);
  }
}
