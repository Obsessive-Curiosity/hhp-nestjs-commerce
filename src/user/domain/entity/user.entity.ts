// Prisma 타입 재사용 (중복 정의 제거)
import { Role, BusinessInfo, ShippingAddress } from '@prisma/client';

export { Role };

export interface UserProps {
  id: string;
  role: Role;
  email: string;
  password: string;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  lastLoginAt?: Date | null;

  // User Aggregate 내부 Relations (생명주기가 User와 동일)
  businessInfo?: BusinessInfo | null;
  shippingAddresses?: ShippingAddress[];
}

export class User {
  private readonly _id: string;
  private readonly _role: Role;
  private readonly _email: string;
  private _password: string;
  private _name: string;
  private _phone: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt?: Date | null;
  private _lastLoginAt?: Date | null;

  // User Aggregate 내부 Relations
  private _businessInfo?: BusinessInfo | null;
  private _shippingAddresses?: ShippingAddress[];

  // 변경된 필드를 추적 (더티 체킹)
  private _dirtyFields: Set<string> = new Set();

  constructor(props: UserProps) {
    this._id = props.id;
    this._role = props.role ?? Role.RETAILER;
    this._email = props.email;
    this._password = props.password;
    this._name = props.name;
    this._phone = props.phone;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._deletedAt = props.deletedAt;
    this._lastLoginAt = props.lastLoginAt;

    // Relations (있으면 할당)
    this._businessInfo = props.businessInfo;
    this._shippingAddresses = props.shippingAddresses;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get role(): Role {
    return this._role;
  }

  get email(): string {
    return this._email;
  }

  get password(): string {
    return this._password;
  }

  get name(): string {
    return this._name;
  }

  get phone(): string {
    return this._phone;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null | undefined {
    return this._deletedAt;
  }

  get lastLoginAt(): Date | null | undefined {
    return this._lastLoginAt;
  }

  // User Aggregate 내부 Relations Getters
  get businessInfo(): BusinessInfo | null | undefined {
    return this._businessInfo;
  }

  get shippingAddresses(): ShippingAddress[] | undefined {
    return this._shippingAddresses;
  }

  // 더티 체킹 관련 메서드
  getDirtyFields(): Set<string> {
    return this._dirtyFields;
  }

  clearDirtyFields(): void {
    this._dirtyFields.clear();
  }

  // 삭제 여부 확인
  isDeleted(): boolean {
    return this._deletedAt !== null && this._deletedAt !== undefined;
  }

  // 활성 사용자 확인
  isActive(): boolean {
    return !this.isDeleted();
  }

  // 관리자 권한 확인
  isAdmin(): boolean {
    return this._role === Role.ADMIN;
  }

  // 도매자 권한 확인
  isWholesaler(): boolean {
    return this._role === Role.WHOLESALER;
  }

  // 소비자 권한 확인
  isRetailer(): boolean {
    return this._role === Role.RETAILER;
  }

  // 로그인 기록
  recordLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
    this._dirtyFields.add('lastLoginAt');
    this._dirtyFields.add('updatedAt');
  }

  // 정보 업데이트
  updateInfo(name?: string, phone?: string): void {
    if (this.isDeleted()) {
      throw new Error('삭제된 사용자는 정보를 수정할 수 없습니다.');
    }

    if (name !== undefined) {
      this._name = name;
      this._dirtyFields.add('name');
    }
    if (phone !== undefined) {
      this._phone = phone;
      this._dirtyFields.add('phone');
    }
    this._updatedAt = new Date();
    this._dirtyFields.add('updatedAt');
  }

  // 비즈니스 로직: 비밀번호 업데이트
  updatePassword(hashedPassword: string): void {
    if (this.isDeleted()) {
      throw new Error('삭제된 사용자는 비밀번호를 변경할 수 없습니다.');
    }
    this._password = hashedPassword;
    this._updatedAt = new Date();
    this._dirtyFields.add('password');
    this._dirtyFields.add('updatedAt');
  }

  // 비즈니스 로직: Soft Delete
  delete(): void {
    if (this.isDeleted()) {
      throw new Error('이미 삭제된 사용자입니다.');
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
    this._dirtyFields.add('deletedAt');
    this._dirtyFields.add('updatedAt');
  }

  // Factory 메서드: 신규 사용자 생성
  static create(params: {
    id: string;
    email: string;
    password: string;
    name: string;
    phone: string;
    role?: Role;
  }): User {
    const now = new Date();
    return new User({
      id: params.id,
      role: params.role ?? Role.RETAILER,
      email: params.email,
      password: params.password,
      name: params.name,
      phone: params.phone,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      lastLoginAt: null,
    });
  }
}
