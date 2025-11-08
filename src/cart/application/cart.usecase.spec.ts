import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
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

describe('CartUseCase (Integration)', () => {
  let useCase: CartUseCase;
  let mockCartService: Partial<jest.Mocked<CartService>>;
  let mockProductService: Partial<jest.Mocked<ProductService>>;
  let mockStockService: Partial<jest.Mocked<StockService>>;

  beforeEach(async () => {
    // Mock Services 생성
    mockCartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      getOrCreateCart: jest.fn(),
    };

    mockProductService = {
      findProductById: jest.fn(),
      checkExistProduct: jest.fn(),
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      findAllProducts: jest.fn(),
      getRolePermissions: jest.fn(),
    };

    mockStockService = {
      checkStock: jest.fn(),
      getStock: jest.fn(),
      getStockQuantity: jest.fn(),
      createStock: jest.fn(),
      decreaseStock: jest.fn(),
      increaseStock: jest.fn(),
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

  describe('getCartWithProducts', () => {
    const user: Payload = {
      sub: 'user-id',
      userId: 'user-id',
      role: Role.RETAILER,
    };

    it('빈 장바구니를 조회할 수 있다', async () => {
      // Given
      const emptyCart = Cart.create(user.sub);
      mockCartService.getCart!.mockResolvedValue(emptyCart);

      // When
      const result = await useCase.getCartWithProducts(user);

      // Then
      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(mockCartService.getCart).toHaveBeenCalledWith(user.sub);
    });

    it('상품 정보와 함께 장바구니를 조회할 수 있다', async () => {
      // Given
      const cart = Cart.create(user.sub);
      cart.addItem('product-1', 2);
      cart.addItem('product-2', 3);

      const product1: ProductWithStock = {
        id: 'product-1',
        name: '상품 1',
        retailPrice: 10000,
        wholesalePrice: 8000,
        imageUrl: 'https://example.com/image1.jpg',
        stock: { quantity: 100 },
      };

      const product2: ProductWithStock = {
        id: 'product-2',
        name: '상품 2',
        retailPrice: 15000,
        wholesalePrice: 12000,
        imageUrl: null,
        stock: { quantity: 50 },
      };

      mockCartService.getCart!.mockResolvedValue(cart);
      mockProductService
        .findProductById!.mockResolvedValueOnce(product1 as unknown as Product)
        .mockResolvedValueOnce(product2 as unknown as Product);

      // When
      const result = await useCase.getCartWithProducts(user);

      // Then
      expect(result.items).toHaveLength(2);
      expect(result.totalItems).toBe(5); // 2 + 3
      expect(result.totalAmount).toBe(65000); // (10000 * 2) + (15000 * 3)

      // 첫 번째 상품 검증
      expect(result.items[0].productId).toBe('product-1');
      expect(result.items[0].productName).toBe('상품 1');
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].price).toBe(10000); // RETAILER는 retailPrice
      expect(result.items[0].availableStock).toBe(100);
      expect(result.items[0].isStockSufficient).toBe(true);

      // 두 번째 상품 검증
      expect(result.items[1].productId).toBe('product-2');
      expect(result.items[1].productName).toBe('상품 2');
      expect(result.items[1].quantity).toBe(3);
      expect(result.items[1].price).toBe(15000);
    });

    it('상품이 삭제된 경우 해당 아이템을 제외한다', async () => {
      // Given
      const cart = Cart.create(user.sub);
      cart.addItem('product-1', 2);
      cart.addItem('deleted-product', 3);

      const product1: ProductWithStock = {
        id: 'product-1',
        name: '상품 1',
        retailPrice: 10000,
        wholesalePrice: 8000,
        stock: { quantity: 100 },
      };

      mockCartService.getCart!.mockResolvedValue(cart);
      mockProductService
        .findProductById!.mockResolvedValueOnce(product1 as unknown as Product)
        .mockResolvedValueOnce(null); // 삭제된 상품

      // When
      const result = await useCase.getCartWithProducts(user);

      // Then
      expect(result.items).toHaveLength(1); // 삭제된 상품은 제외
      expect(result.totalItems).toBe(2);
      expect(result.totalAmount).toBe(20000);
    });
  });

  describe('addItem', () => {
    const userId = 'user-id';

    it('장바구니에 상품을 추가할 수 있다', async () => {
      // Given
      const dto: AddCartItemDto = {
        productId: 'product-1',
        quantity: 5,
      };

      mockProductService.checkExistProduct!.mockResolvedValue(true);
      mockStockService.checkStock!.mockResolvedValue(true);
      mockCartService.addItem!.mockResolvedValue(undefined);

      // When
      await useCase.addItem(userId, dto);

      // Then
      expect(mockProductService.checkExistProduct).toHaveBeenCalledWith(
        'product-1',
      );
      expect(mockStockService.checkStock).toHaveBeenCalledWith('product-1', 5);
      expect(mockCartService.addItem).toHaveBeenCalledWith(
        userId,
        'product-1',
        5,
      );
    });

    it('상품이 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const dto: AddCartItemDto = {
        productId: 'non-existent-product',
        quantity: 5,
      };

      mockProductService.checkExistProduct!.mockRejectedValue(
        new NotFoundException('상품을 찾을 수 없습니다.'),
      );

      // When & Then
      await expect(useCase.addItem(userId, dto)).rejects.toThrow(
        NotFoundException,
      );

      // checkExistProduct에서 예외가 발생하므로 이후 로직은 실행되지 않음
      expect(mockStockService.checkStock).not.toHaveBeenCalled();
      expect(mockCartService.addItem).not.toHaveBeenCalled();
    });
  });

  describe('updateItem', () => {
    const userId = 'user-id';
    const productId = 'product-1';

    it('장바구니 상품 수량을 수정할 수 있다', async () => {
      // Given
      const dto: UpdateCartItemDto = {
        quantity: 10,
      };

      mockProductService.checkExistProduct!.mockResolvedValue(true);
      mockStockService.checkStock!.mockResolvedValue(true);
      mockCartService.updateQuantity!.mockResolvedValue(undefined);

      // When
      await useCase.updateItem(userId, productId, dto);

      // Then
      expect(mockProductService.checkExistProduct).toHaveBeenCalledWith(
        productId,
      );
      expect(mockStockService.checkStock).toHaveBeenCalledWith(productId, 10);
      expect(mockCartService.updateQuantity).toHaveBeenCalledWith(
        userId,
        productId,
        10,
      );
    });

    it('상품이 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const dto: UpdateCartItemDto = {
        quantity: 10,
      };

      mockProductService.checkExistProduct!.mockRejectedValue(
        new NotFoundException('상품을 찾을 수 없습니다.'),
      );

      // When & Then
      await expect(useCase.updateItem(userId, productId, dto)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockStockService.checkStock).not.toHaveBeenCalled();
      expect(mockCartService.updateQuantity).not.toHaveBeenCalled();
    });
  });
});
