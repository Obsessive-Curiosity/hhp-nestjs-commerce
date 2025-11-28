import { Injectable } from '@nestjs/common';
import { UserService } from '../../domain/service/user.service';
import { AddressService } from '../../domain/service/address.service';
import { CreateAddressDto, UpdateAddressDto } from '../../presentation/dto';
import {
  GetAddressesResponseDto,
  GetDefaultAddressResponseDto,
  CreateAddressResponseDto,
  UpdateAddressResponseDto,
  SetDefaultAddressResponseDto,
  DeleteAddressResponseDto,
} from '../dto';

/**
 * In Domain Usecase
 * User 도메인 내부의 Address 관련 협력 로직
 */
@Injectable()
export class UserAddressUsecase {
  constructor(
    private readonly userService: UserService,
    private readonly addressService: AddressService,
  ) {}

  // ==================== 주소 조회 ====================

  // 내 주소 목록 조회
  async getMyAddresses(userId: string): Promise<GetAddressesResponseDto> {
    const addresses = await this.addressService.getAddressesByUserId(userId);

    return GetAddressesResponseDto.from(addresses);
  }

  // 기본 배송지 조회
  async getMyDefaultAddress(
    userId: string,
  ): Promise<GetDefaultAddressResponseDto> {
    const address = await this.addressService.getDefaultAddress(userId);

    return GetDefaultAddressResponseDto.from(address);
  }

  // ==================== 주소 생성 ====================

  // 주소 생성 (사용자 조회 필요)
  async createMyAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<CreateAddressResponseDto> {
    // UserService로 사용자 조회 (존재 여부 검증)
    const user = await this.userService.getUserById(userId);

    // AddressService로 주소 생성
    const address = await this.addressService.createAddress(user, dto);

    return CreateAddressResponseDto.from(address);
  }

  // ==================== 주소 수정 ====================

  // 주소 수정
  async updateMyAddress(
    userId: string,
    addressId: number,
    dto: UpdateAddressDto,
  ): Promise<UpdateAddressResponseDto> {
    const address = await this.addressService.updateAddress(
      addressId,
      userId,
      dto,
    );

    return UpdateAddressResponseDto.from(address);
  }

  // 기본 배송지 설정
  async setMyDefaultAddress(
    userId: string,
    addressId: number,
  ): Promise<SetDefaultAddressResponseDto> {
    const address = await this.addressService.setDefaultAddress(
      addressId,
      userId,
    );

    return SetDefaultAddressResponseDto.from(address);
  }

  // ==================== 주소 삭제 ====================

  // 주소 삭제
  async deleteMyAddress(
    userId: string,
    addressId: number,
  ): Promise<DeleteAddressResponseDto> {
    await this.addressService.deleteAddress(addressId, userId);

    return DeleteAddressResponseDto.from();
  }
}
