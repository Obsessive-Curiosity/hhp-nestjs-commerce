import { Injectable } from '@nestjs/common';
import { ProductService } from '../../domain/service/product.service';
import { StockService } from '../../domain/service/stock.service';
import { CreateProductProps } from '../../domain/types';
import { CreateProductResponseDto } from '../dto';

export type CreateProductWithStockProps = CreateProductProps & {
  stock: number;
};

@Injectable()
export class CreateProductUsecase {
  constructor(
    private readonly productService: ProductService,
    private readonly stockService: StockService,
  ) {}

  // 상품 생성 (In Domain - Product + Stock 함께 생성)
  async execute(
    props: CreateProductWithStockProps,
  ): Promise<CreateProductResponseDto> {
    const { stock, ...productProps } = props;

    // Product 생성
    const product = await this.productService.createProduct(productProps);

    // Stock 생성 (트랜잭션 내에서 함께 처리)
    await this.stockService.createStock(product.id, stock);

    return CreateProductResponseDto.from(product);
  }
}
