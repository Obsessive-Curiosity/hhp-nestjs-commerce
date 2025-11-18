import {
  Entity,
  PrimaryKey,
  Property,
  Enum,
  t,
  Embeddable,
  Embedded,
} from '@mikro-orm/core';
import { v7 as uuidv7 } from 'uuid';
import { BadRequestException } from '@nestjs/common';
import { UpdateUserProps } from '../types';

// Role enum 정의
export enum Role {
  GUEST = 'GUEST', // 게스트 (미인증)
  RETAILER = 'RETAILER', // 소비자 (B2C)
  WHOLESALER = 'WHOLESALER', // 도매자 (B2B)
  ADMIN = 'ADMIN', // 관리자
}

@Embeddable()
export class PhoneNumber {
  @Property()
  number!: string;
  @Property()
  type?: string; // 예: 'mobile', 'work'
}

export type CreateUserProps = {
  email: string;
  password: string;
  name: string;
  personalPhone: PhoneNumber;
  companyPhone?: PhoneNumber | null;
  role?: Role;
};

@Entity()
export class User {
  @PrimaryKey({ type: t.character, length: 36 })
  id: string = uuidv7();

  // 사용자 역할 (RETAILER: 소비자, WHOLESALER: 도매자, ADMIN: 관리자)
  @Enum(() => Role)
  role?: Role = Role.RETAILER;

  // 이메일 (고유값)
  @Property({ type: t.string, unique: true })
  email!: string;

  // 비밀번호 (해시됨)
  @Property({ type: t.string })
  password!: string;

  // 이름
  @Property({ type: t.string })
  name!: string;

  // 개인 전화번호
  @Embedded(() => PhoneNumber, { prefix: 'personal_' })
  personalPhone!: PhoneNumber;

  // 회사 전화번호 (null = 없음)
  @Embedded(() => PhoneNumber, { prefix: 'company_', nullable: true })
  companyPhone: PhoneNumber | null = null;

  // =================== Timestamps ===================

  // 사용자 생성일
  @Property({ type: t.datetime, onCreate: () => new Date() })
  createdAt: Date;

  // 사용자 수정일
  @Property({ type: t.datetime, onUpdate: () => new Date() })
  updatedAt: Date;

  // 사용자 삭제일 (null = 삭제되지 않음, Soft Delete)
  @Property({ type: t.datetime, nullable: true })
  deletedAt!: Date | null;

  // 마지막 로그인 일시 (null = 로그인 기록 없음)
  @Property({ type: t.datetime, nullable: true })
  lastLoginAt!: Date | null;

  // =================== Constructor ===================

  protected constructor(data?: Partial<User>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================

  // 사용자 생성
  static create(props: CreateUserProps): User {
    const user = new User(); // 빈 사용자 객체 생성

    user.email = props.email;
    user.password = props.password; // 이미 해싱된 비밀번호
    user.name = props.name;
    user.personalPhone = props.personalPhone;
    user.companyPhone = props.companyPhone ?? null;
    user.role = props.role ?? Role.RETAILER; // 기본값: RETAILER

    return user;
  }

  // ======================= 조회 =======================

  // 역할 확인
  isAdmin(): boolean {
    return this.role === Role.ADMIN;
  }

  isWholesaler(): boolean {
    return this.role === Role.WHOLESALER;
  }

  isRetailer(): boolean {
    return this.role === Role.RETAILER;
  }

  // 상태 확인
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isActive(): boolean {
    return !this.isDeleted();
  }

  // ======================= 수정 =======================

  // 로그인 기록
  recordLogin(): void {
    this.lastLoginAt = new Date();
  }

  // 정보 수정
  updateInfo(props: UpdateUserProps): void {
    if (this.isDeleted()) {
      throw new BadRequestException(
        '삭제된 사용자는 정보를 수정할 수 없습니다',
      );
    }

    this.name = props.name ?? this.name;
    this.personalPhone = props.personalPhone ?? this.personalPhone;
    this.companyPhone = props.companyPhone ?? this.companyPhone;
  }

  // 비밀번호 변경
  updatePassword(hashedPassword: string): void {
    if (this.isDeleted()) {
      throw new BadRequestException(
        '삭제된 사용자는 비밀번호를 변경할 수 없습니다',
      );
    }

    this.password = hashedPassword;
  }

  // ======================= 삭제 =======================

  // 계정 삭제 (소프트 삭제)
  softDelete(): void {
    if (this.isDeleted()) {
      throw new BadRequestException('이미 삭제된 사용자입니다');
    }
    this.deletedAt = new Date();
  }
}
