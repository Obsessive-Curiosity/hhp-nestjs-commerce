import { Test, TestingModule } from '@nestjs/testing';
import { CartUseCase } from './cart.usecase';
import { CartService } from '../domain/service/cart.service';
import { ProductService } from '../../product/domain/service/product.service';
import { StockService } from '../../product/domain/service/stock.service';
import { Cart } from '../domain/entity/cart.entity';
import { Role } from '@prisma/client';
import { AddCartItemDto } from '../presentation/dto/add-cart-item.dto';
import { UpdateCartItemDto } from '../presentation/dto/update-cart-item.dto';
import { Payload } from '@/types/express';
import { ProductWithStock } from '../presentation/dto/cart-response.dto';
import { Product } from '../../product/domain/entity/product.entity';

describe('CartUseCase Policy', () => {
  let useCase: CartUseCase;
  let mockCartService: Partial<jest.Mocked<CartService>>;
  let mockProductService: Partial<jest.Mocked<ProductService>>;
  let mockStockService: Partial<jest.Mocked<StockService>>;

  beforeEach(async () => {
    mockCartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateQuantity: jest.fn(),
    };

    mockProductService = {
      findProductById: jest.fn(),
      checkExistProduct: jest.fn(),
    };

    mockStockService = {
      checkStock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartUseCase,
        {
          provide: CartService,
          useValue: mockCartService,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    }).compile();

    useCase = module.get<CartUseCase>(CartUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('가격 정책', () => {
    const user: Payload = {
      sub: 'user-id',
      userId: 'user-id',
      role: Role.RETAILER,
    };

    it('WHOLESALER는 도매가(wholesalePrice)로 장바구니를 조회한다', async () => {
      // Given
      const wholesalerUser: Payload = {
        sub: 'user-id',
        userId: 'user-id',
        role: Role.WHOLESALER,
      };

      const cart = Cart.create(wholesalerUser.sub);
      cart.addItem('product-1', 2);

      const product: ProductWithStock = {
        id: 'product-1',
        name: '상품 1',
        retailPrice: 10000,
        wholesalePrice: 8000,
        stock: { quantity: 100 },
      };

      mockCartService.getCart!.mockResolvedValue(cart);
      mockProductService.findProductById!.mockResolvedValue(
        product as unknown as Product,
      );

      // When
      const result = await useCase.getCartWithProducts(wholesalerUser);

      // Then
      expect(result.items[0].price).toBe(8000); // WHOLESALER는 wholesalePrice
      expect(result.totalAmount).toBe(16000); // 8000 * 2
    });

    it('RETAILER는 소매가(retailPrice)로 장바구니를 조회한다', async () => {
      // Given
      const cart = Cart.create(user.sub);
      cart.addItem('product-1', 2);

      const product: ProductWithStock = {
        id: 'product-1',
        name: '상품 1',
        retailPrice: 10000,
        wholesalePrice: 8000,
        stock: { quantity: 100 },
      };

      mockCartService.getCart!.mockResolvedValue(cart);
      mockProductService.findProductById!.mockResolvedValue(
        product as unknown as Product,
      );

      // When
      const result = await useCase.getCartWithProducts(user);

      // Then
      expect(result.items[0].price).toBe(10000); // RETAILER는 retailPrice
      expect(result.totalAmount).toBe(20000); // 10000 * 2
    });
  });

  describe('재고 정책', () => {
    const userId = 'user-id';
    const user: Payload = {
      sub: 'user-id',
      userId: 'user-id',
      role: Role.RETAILER,
    };

    describe('재고 부족 시 장바구니 추가/수정 불가', () => {
      it('재고가 부족하면 장바구니 추가를 할 수 없다', async () => {
        // Given
        const dto: AddCartItemDto = {
          productId: 'product-1',
          quantity: 100,
        };

        mockProductService.checkExistProduct!.mockResolvedValue(true);
        mockStockService.checkStock!.mockRejectedValue(
          new Error('재고가 부족합니다.'),
        );

        // When & Then
        await expect(useCase.addItem(userId, dto)).rejects.toThrow(
          '재고가 부족합니다.',
        );

        // checkStock에서 예외가 발생하므로 addItem은 실행되지 않음
        expect(mockCartService.addItem).not.toHaveBeenCalled();
      });

      it('재고가 부족하면 장바구니 수량 수정을 할 수 없다', async () => {
        // Given
        const productId = 'product-1';
        const dto: UpdateCartItemDto = {
          quantity: 100,
        };

        mockProductService.checkExistProduct!.mockResolvedValue(true);
        mockStockService.checkStock!.mockRejectedValue(
          new Error('재고가 부족합니다.'),
        );

        // When & Then
        await expect(useCase.updateItem(userId, productId, dto)).rejects.toThrow(
          '재고가 부족합니다.',
        );

        expect(mockCartService.updateQuantity).not.toHaveBeenCalled();
      });
    });

    describe('재고 부족 상태 표시', () => {
      it('재고가 부족한 경우 isStockSufficient가 false이다', async () => {
        // Given
        const cart = Cart.create(user.sub);
        cart.addItem('product-1', 10); // 재고보다 많은 수량

        const product: ProductWithStock = {
          id: 'product-1',
          name: '상품 1',
          retailPrice: 10000,
          wholesalePrice: 8000,
          stock: { quantity: 5 }, // 재고 부족
        };

        mockCartService.getCart!.mockResolvedValue(cart);
        mockProductService.findProductById!.mockResolvedValue(
          product as unknown as Product,
        );

        // When
        const result = await useCase.getCartWithProducts(user);

        // Then
        expect(result.items[0].isStockSufficient).toBe(false);
        expect(result.items[0].availableStock).toBe(5);
      });

      it('재고가 충분한 경우 isStockSufficient가 true이다', async () => {
        // Given
        const cart = Cart.create(user.sub);
        cart.addItem('product-1', 5);

        const product: ProductWithStock = {
          id: 'product-1',
          name: '상품 1',
          retailPrice: 10000,
          wholesalePrice: 8000,
          stock: { quantity: 100 }, // 재고 충분
        };

        mockCartService.getCart!.mockResolvedValue(cart);
        mockProductService.findProductById!.mockResolvedValue(
          product as unknown as Product,
        );

        // When
        const result = await useCase.getCartWithProducts(user);

        // Then
        expect(result.items[0].isStockSufficient).toBe(true);
        expect(result.items[0].availableStock).toBe(100);
      });
    });
  });

  describe('실행 순서 정책', () => {
    const userId = 'user-id';

    describe('장바구니 추가 실행 순서', () => {
      it('상품 존재 확인 -> 재고 확인 -> 장바구니 추가 순서로 실행된다', async () => {
        // Given
        const dto: AddCartItemDto = {
          productId: 'product-1',
          quantity: 5,
        };

        const callOrder: string[] = [];

        mockProductService.checkExistProduct!.mockImplementation(() => {
          callOrder.push('checkExistProduct');
          return Promise.resolve(true);
        });

        mockStockService.checkStock!.mockImplementation(() => {
          callOrder.push('checkStock');
          return Promise.resolve(true);
        });

        mockCartService.addItem!.mockImplementation(() => {
          callOrder.push('addItem');
          return Promise.resolve();
        });

        // When
        await useCase.addItem(userId, dto);

        // Then
        expect(callOrder).toEqual(['checkExistProduct', 'checkStock', 'addItem']);
      });
    });

    describe('장바구니 수량 수정 실행 순서', () => {
      it('상품 존재 확인 -> 재고 확인 -> 수량 업데이트 순서로 실행된다', async () => {
        // Given
        const productId = 'product-1';
        const dto: UpdateCartItemDto = {
          quantity: 10,
        };

        const callOrder: string[] = [];

        mockProductService.checkExistProduct!.mockImplementation(() => {
          callOrder.push('checkExistProduct');
          return Promise.resolve(true);
        });

        mockStockService.checkStock!.mockImplementation(() => {
          callOrder.push('checkStock');
          return Promise.resolve(true);
        });

        mockCartService.updateQuantity!.mockImplementation(() => {
          callOrder.push('updateQuantity');
          return Promise.resolve();
        });

        // When
        await useCase.updateItem(userId, productId, dto);

        // Then
        expect(callOrder).toEqual([
          'checkExistProduct',
          'checkStock',
          'updateQuantity',
        ]);
      });
    });
  });
});
