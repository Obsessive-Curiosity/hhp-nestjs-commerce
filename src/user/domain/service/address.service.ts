import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Address } from '../entity/address.entity';
import { CreateAddressProps, UpdateAddressProps } from '../types';
import {
  IAddressRepository,
  ADDRESS_REPOSITORY,
} from '../interface/address.repository.interface';
import { User } from '../entity/user.entity';

@Injectable()
export class AddressService {
  constructor(
    @Inject(ADDRESS_REPOSITORY)
    private readonly addressRepository: IAddressRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // ID로 주소 조회
  async getAddressById(addressId: number): Promise<Address> {
    const address = await this.addressRepository.findOne(addressId);

    if (!address) {
      throw new NotFoundException('주소를 찾을 수 없습니다.');
    }

    return address;
  }

  // 사용자별 주소 목록 조회
  async getAddressesByUserId(userId: string): Promise<Address[]> {
    return await this.addressRepository.find(userId);
  }

  // 기본 배송지 조회
  async getDefaultAddress(userId: string): Promise<Address | null> {
    return await this.addressRepository.findDefault(userId);
  }

  // ==================== 생성 (Create) ====================

  // 주소 생성
  async createAddress(
    user: User,
    props: Omit<CreateAddressProps, 'userId'>,
  ): Promise<Address> {
    // 기본 배송지로 설정하려는 경우, 기존 기본 배송지를 해제
    if (props.isDefault) {
      await this.addressRepository.unsetAllDefault(user.id);
    }

    const address = Address.create({ ...props, userId: user.id });
    return await this.addressRepository.save(address);
  }

  // ==================== 수정 (Update) ====================

  // 주소 정보 수정
  async updateAddress(
    addressId: number,
    userId: string,
    props: UpdateAddressProps,
  ): Promise<Address> {
    const address = await this.getAddressById(addressId);

    // 주소 소유자 확인
    if (address.user.id !== userId) {
      throw new BadRequestException('해당 주소를 수정할 권한이 없습니다.');
    }

    // 기본 배송지로 설정하려는 경우, 기존 기본 배송지를 해제
    if (props.isDefault && !address.isDefault) {
      await this.addressRepository.unsetAllDefault(userId);
    }

    address.update(props);
    return await this.addressRepository.update(address);
  }

  // 기본 배송지 설정
  async setDefaultAddress(addressId: number, userId: string): Promise<Address> {
    const address = await this.getAddressById(addressId);

    // 주소 소유자 확인
    if (address.user.id !== userId) {
      throw new BadRequestException('해당 주소를 수정할 권한이 없습니다.');
    }

    // 기존 기본 배송지를 모두 해제
    await this.addressRepository.unsetAllDefault(userId);

    // 현재 주소를 기본 배송지로 설정
    address.setDefault();
    return await this.addressRepository.update(address);
  }

  // ==================== 삭제 (Delete) ====================

  // 주소 삭제
  async deleteAddress(addressId: number, userId: string): Promise<void> {
    const address = await this.getAddressById(addressId);

    // 주소 소유자 확인
    if (address.user.id !== userId) {
      throw new BadRequestException('해당 주소를 삭제할 권한이 없습니다.');
    }

    await this.addressRepository.delete(addressId);
  }
}
