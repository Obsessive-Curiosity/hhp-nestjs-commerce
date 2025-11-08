import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../interface/cart.repository.interface';
import { Cart } from '../entity/cart.entity';

describe('CartService', () => {
  let service: CartService;
  let mockRepository: jest.Mocked<ICartRepository>;

  beforeEach(async () => {
    // Mock Repository 생성
    mockRepository = {
      findByUserId: jest.fn(),
      setItem: jest.fn(),
      deleteItem: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CART_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('기존 장바구니를 조회할 수 있다', async () => {
      // Given
      const userId = 'user-id';
      const existingCart = Cart.create(userId);
      mockRepository.findByUserId.mockResolvedValue(existingCart);

      // When
      const result = await service.getOrCreateCart(userId);

      // Then
      expect(result).toBe(existingCart);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('장바구니가 없으면 새로 생성한다', async () => {
      // Given
      const userId = 'user-id';
      mockRepository.findByUserId.mockResolvedValue(null);

      // When
      const result = await service.getOrCreateCart(userId);

      // Then
      expect(result.userId).toBe(userId);
      expect(result.isEmpty()).toBe(true);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('addItem', () => {
    it('장바구니에 상품을 추가할 수 있다', async () => {
      // Given
      const userId = 'user-id';
      const productId = 'product-id';
      const quantity = 5;

      mockRepository.setItem.mockResolvedValue(undefined);

      // When
      await service.addItem(userId, productId, quantity);

      // Then
      expect(mockRepository.setItem).toHaveBeenCalledWith(
        userId,
        productId,
        quantity,
      );
    });
  });

  describe('updateQuantity', () => {
    it('상품 수량을 업데이트할 수 있다', async () => {
      // Given
      const userId = 'user-id';
      const productId = 'product-id';
      const newQuantity = 10;

      mockRepository.setItem.mockResolvedValue(undefined);

      // When
      await service.updateQuantity(userId, productId, newQuantity);

      // Then
      expect(mockRepository.setItem).toHaveBeenCalledWith(
        userId,
        productId,
        newQuantity,
      );
    });
  });

  describe('removeItem', () => {
    it('장바구니에서 상품을 제거할 수 있다', async () => {
      // Given
      const userId = 'user-id';
      const productId = 'product-id';

      mockRepository.deleteItem.mockResolvedValue(undefined);

      // When
      await service.removeItem(userId, productId);

      // Then
      expect(mockRepository.deleteItem).toHaveBeenCalledWith(userId, productId);
    });
  });

  describe('clearCart', () => {
    it('장바구니를 비울 수 있다', async () => {
      // Given
      const userId = 'user-id';
      mockRepository.delete.mockResolvedValue(undefined);

      // When
      await service.clearCart(userId);

      // Then
      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
    });
  });

  describe('getCart', () => {
    it('장바구니를 조회할 수 있다', async () => {
      // Given
      const userId = 'user-id';
      const cart = Cart.create(userId);
      mockRepository.findByUserId.mockResolvedValue(cart);

      // When
      const result = await service.getCart(userId);

      // Then
      expect(result).toBe(cart);
      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('장바구니가 없으면 새로 생성해서 반환한다', async () => {
      // Given
      const userId = 'user-id';
      mockRepository.findByUserId.mockResolvedValue(null);

      // When
      const result = await service.getCart(userId);

      // Then
      expect(result.userId).toBe(userId);
      expect(result.isEmpty()).toBe(true);
    });
  });
});
