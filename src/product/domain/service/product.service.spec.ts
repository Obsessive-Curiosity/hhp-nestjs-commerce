import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../interface/product.repository.interface';
import { Product } from '../entity/product.entity';
import { Role } from '@prisma/client';

describe('ProductService', () => {
  let service: ProductService;
  let mockRepository: jest.Mocked<IProductRepository>;

  beforeEach(async () => {
    // Mock Repository 생성
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      existsById: jest.fn(),
      findByCategoryId: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('신규 상품을 생성할 수 있다', async () => {
      // Given
      const dto = {
        categoryId: 1,
        name: '테스트 상품',
        description: '테스트 상품 설명',
        retailPrice: 10000,
        wholesalePrice: 8000,
        imageUrl: 'https://example.com/image.jpg',
      };

      const createdProduct = Product.create({
        id: 'test-product-id',
        ...dto,
      });

      mockRepository.create.mockResolvedValue(createdProduct);

      // When
      const result = await service.createProduct(dto);

      // Then
      expect(result.name).toBe(dto.name);
      expect(result.categoryId).toBe(dto.categoryId);
      expect(result.retailPrice).toBe(dto.retailPrice);
      expect(result.wholesalePrice).toBe(dto.wholesalePrice);
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('이미지 URL 없이 상품을 생성할 수 있다', async () => {
      // Given
      const dto = {
        categoryId: 1,
        name: '테스트 상품',
        description: '테스트 상품 설명',
        retailPrice: 10000,
        wholesalePrice: 8000,
      };

      const createdProduct = Product.create({
        id: 'test-product-id',
        ...dto,
        imageUrl: null,
      });

      mockRepository.create.mockResolvedValue(createdProduct);

      // When
      const result = await service.createProduct(dto);

      // Then
      expect(result.imageUrl).toBeNull();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('가격 정책 위반 시 예외를 발생시킨다', async () => {
      // Given - 도매가가 소매가보다 높은 경우
      const dto = {
        categoryId: 1,
        name: '테스트 상품',
        description: '테스트 상품 설명',
        retailPrice: 8000,
        wholesalePrice: 10000,
      };

      // When & Then
      await expect(service.createProduct(dto)).rejects.toThrow(
        'B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.',
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('상품 정보를 수정할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const existingProduct = Product.create({
        id: productId,
        categoryId: 1,
        name: '기존 상품',
        description: '기존 설명',
        retailPrice: 10000,
        wholesalePrice: 8000,
        imageUrl: null,
      });

      const updateDto = {
        name: '수정된 상품',
        description: '수정된 설명',
      };

      mockRepository.findById.mockResolvedValue(existingProduct);
      mockRepository.update.mockResolvedValue(existingProduct);

      // When
      const result = await service.updateProduct(productId, updateDto);

      // Then
      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
      expect(mockRepository.findById).toHaveBeenCalledWith(productId);
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('상품이 존재하지 않으면 예외를 발생시킨다', async () => {
      // Given
      const productId = 'non-existent-id';
      mockRepository.findById.mockResolvedValue(null);

      // When & Then
      await expect(
        service.updateProduct(productId, { name: '새 이름' }),
      ).rejects.toThrow(`ID ${productId}인 상품을 찾을 수 없습니다.`);

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('가격 정책 위반 시 예외를 발생시킨다', async () => {
      // Given
      const productId = 'test-product-id';
      const existingProduct = Product.create({
        id: productId,
        categoryId: 1,
        name: '기존 상품',
        description: '기존 설명',
        retailPrice: 10000,
        wholesalePrice: 8000,
        imageUrl: null,
      });

      const updateDto = {
        retailPrice: 7000,
        wholesalePrice: 9000,
      };

      mockRepository.findById.mockResolvedValue(existingProduct);

      // When & Then
      await expect(service.updateProduct(productId, updateDto)).rejects.toThrow(
        'B2B 가격(도매가)은 B2C 가격(소매가)보다 낮아야 합니다.',
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('findAllProducts', () => {
    it('모든 상품을 조회할 수 있다', async () => {
      // Given
      const products = [
        Product.create({
          id: 'product-1',
          categoryId: 1,
          name: '상품 1',
          description: '설명 1',
          retailPrice: 10000,
          wholesalePrice: 8000,
          imageUrl: null,
        }),
        Product.create({
          id: 'product-2',
          categoryId: 1,
          name: '상품 2',
          description: '설명 2',
          retailPrice: 15000,
          wholesalePrice: 12000,
          imageUrl: null,
        }),
      ];

      mockRepository.findAll.mockResolvedValue(products);

      // When
      const result = await service.findAllProducts();

      // Then
      expect(result).toHaveLength(2);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, {
        includeCategory: true,
        includeStock: true,
        userRole: undefined,
      });
    });

    it('사용자 권한에 따라 상품을 조회할 수 있다', async () => {
      // Given
      const user = { sub: 'user-id', userId: 'user-id', role: Role.RETAILER };
      const products = [
        Product.create({
          id: 'product-1',
          categoryId: 1,
          name: '상품 1',
          description: '설명 1',
          retailPrice: 10000,
          wholesalePrice: 8000,
          imageUrl: null,
        }),
      ];

      mockRepository.findAll.mockResolvedValue(products);

      // When
      const result = await service.findAllProducts(user);

      // Then
      expect(result).toHaveLength(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, {
        includeCategory: true,
        includeStock: true,
        userRole: Role.RETAILER,
      });
    });
  });

  describe('findProductById', () => {
    it('상품 ID로 조회할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const product = Product.create({
        id: productId,
        categoryId: 1,
        name: '테스트 상품',
        description: '테스트 상품 설명',
        retailPrice: 10000,
        wholesalePrice: 8000,
        imageUrl: null,
      });

      mockRepository.findById.mockResolvedValue(product);

      // When
      const result = await service.findProductById(productId);

      // Then
      expect(result).toBe(product);
      expect(mockRepository.findById).toHaveBeenCalledWith(productId, {
        includeCategory: true,
        includeStock: true,
        userRole: undefined,
      });
    });

    it('사용자 권한에 따라 상품을 조회할 수 있다', async () => {
      // Given
      const productId = 'test-product-id';
      const user = { sub: 'user-id', userId: 'user-id', role: Role.WHOLESALER };
      const product = Product.create({
        id: productId,
        categoryId: 1,
        name: '테스트 상품',
        description: '테스트 상품 설명',
        retailPrice: 10000,
        wholesalePrice: 8000,
        imageUrl: null,
      });

      mockRepository.findById.mockResolvedValue(product);

      // When
      const result = await service.findProductById(productId, user);

      // Then
      expect(result).toBe(product);
      expect(mockRepository.findById).toHaveBeenCalledWith(productId, {
        includeCategory: true,
        includeStock: true,
        userRole: Role.WHOLESALER,
      });
    });

    it('상품이 존재하지 않으면 null을 반환한다', async () => {
      // Given
      mockRepository.findById.mockResolvedValue(null);

      // When
      const result = await service.findProductById('non-existent-id');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('getRolePermissions', () => {
    it('RETAILER는 B2C 권한을 가진다', () => {
      // When
      const result = service.getRolePermissions(Role.RETAILER);

      // Then
      expect(result.isB2C).toBe(true);
      expect(result.isB2B).toBe(false);
    });

    it('WHOLESALER는 B2B 권한을 가진다', () => {
      // When
      const result = service.getRolePermissions(Role.WHOLESALER);

      // Then
      expect(result.isB2C).toBe(false);
      expect(result.isB2B).toBe(true);
    });

    it('ADMIN은 B2C와 B2B 권한을 모두 가진다', () => {
      // When
      const result = service.getRolePermissions(Role.ADMIN);

      // Then
      expect(result.isB2C).toBe(true);
      expect(result.isB2B).toBe(true);
    });

    it('권한이 없으면 B2C 권한을 가진다', () => {
      // When
      const result = service.getRolePermissions(undefined);

      // Then
      expect(result.isB2C).toBe(true);
      expect(result.isB2B).toBe(false);
    });
  });
});
