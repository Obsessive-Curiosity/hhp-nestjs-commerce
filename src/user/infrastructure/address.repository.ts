import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/mysql';
import { Address } from '../domain/entity/address.entity';
import { IAddressRepository } from '../domain/interface/address.repository.interface';

@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(private readonly em: EntityManager) {}

  // ==================== 조회 (Query) ====================

  // ID로 주소 조회
  async findOne(id: number): Promise<Address | null> {
    return await this.em.findOne(Address, { id });
  }

  // 사용자별 주소 목록 조회
  async find(userId: string): Promise<Address[]> {
    return await this.em.find(Address, { user: userId });
  }

  // 사용자의 기본 배송지 조회
  async findDefault(userId: string): Promise<Address | null> {
    return await this.em.findOne(Address, { user: userId, isDefault: true });
  }

  // ==================== 생성 (Create) ====================

  // 주소 저장
  async save(address: Address): Promise<Address> {
    await this.em.persistAndFlush(address);
    return address;
  }

  // ==================== 수정 (Update) ====================

  // 주소 수정
  async update(address: Address): Promise<Address> {
    await this.em.flush();
    return address;
  }

  // 모든 기본 배송지 해제
  async unsetAllDefault(userId: string): Promise<void> {
    await this.em.nativeUpdate(
      Address,
      { user: userId, isDefault: true },
      { isDefault: false },
    );
  }

  // ==================== 삭제 (Delete) ====================

  // 주소 삭제
  async delete(id: number): Promise<void> {
    const address = await this.em.findOne(Address, { id });
    if (address) {
      await this.em.removeAndFlush(address);
    }
  }
}
