import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Category } from '../entity/category.entity';
import {
  ICategoryRepository,
  CATEGORY_REPOSITORY,
} from '../interface/category.repository.interface';
import { CreateCategoryProps, UpdateCategoryProps } from '../types';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // ID로 카테고리 조회 (nullable)
  async findById(id: number): Promise<Category | null> {
    return await this.categoryRepository.findById(id);
  }

  // ID로 카테고리 조회 (예외 발생)
  async getCategoryById(id: number): Promise<Category> {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`ID ${id}인 카테고리를 찾을 수 없습니다.`);
    }

    return category;
  }

  // 활성화된 카테고리 목록 조회
  async findActive(): Promise<Category[]> {
    return await this.categoryRepository.findActive();
  }

  // 모든 카테고리 조회
  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  // ==================== 생성 (Create) ====================

  // 카테고리 생성
  async create(props: CreateCategoryProps): Promise<Category> {
    // 1. 중복 이름 검증
    const existing = await this.categoryRepository.findByName(props.name);
    if (existing) {
      throw new ConflictException('이미 존재하는 카테고리 이름입니다.');
    }

    // 2. 카테고리 생성
    const category = Category.create(props.name, props.active);

    // 3. 저장 후 반환
    return await this.categoryRepository.create(category);
  }

  // ==================== 수정 (Update) ====================

  // 카테고리 수정
  async update(id: number, props: UpdateCategoryProps): Promise<Category> {
    // 1. 존재하는 카테고리인지 확인
    const category = await this.getCategoryById(id);

    // 2. 이름 중복 검증 (이름을 변경하는 경우)
    if (props.name && props.name !== category.name) {
      const existing = await this.categoryRepository.findByName(props.name);
      if (existing) {
        throw new ConflictException('이미 존재하는 카테고리 이름입니다.');
      }
    }

    // 3. 카테고리 정보 수정
    category.updateInfo(props.name, props.active);

    // 4. 저장 후 반환
    return await this.categoryRepository.update(category);
  }
}
