import { Address } from '../entity/address.entity';

export interface IAddressRepository {
  // 주소 조회
  findOne(id: number): Promise<Address | null>;

  // 사용자의 모든 주소 조회
  find(userId: string): Promise<Address[]>;

  // 사용자의 기본 배송지 조회
  findDefault(userId: string): Promise<Address | null>;

  // 주소 저장 (생성 또는 업데이트)
  save(address: Address): Promise<Address>;

  // 주소 업데이트
  update(address: Address): Promise<Address>;

  // 주소 삭제
  delete(id: number): Promise<void>;

  // 사용자의 모든 배송지를 기본 배송지가 아니도록 설정
  unsetAllDefault(userId: string): Promise<void>;
}

// Repository 의존성 주입을 위한 토큰
export const ADDRESS_REPOSITORY = Symbol('ADDRESS_REPOSITORY');
