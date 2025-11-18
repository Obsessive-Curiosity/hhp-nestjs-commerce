import { Injectable } from '@nestjs/common';
import { UserService, CreateUserParams } from '../domain/service/user.service';
import {
  UpdateUserDto,
  CreateAddressDto,
  UpdateAddressDto,
} from '../presentation/dto';
import { UserWalletUsecase } from './cross-domain/user-wallet.usecase';
import { UserAddressUsecase } from './in-domain/user-address.usecase';
import { UpdateMyInfoResponseDto, DeleteAccountResponseDto } from './dto';

/**
 * UserFacade
 * - 단일 도메인 서비스만 사용하는 로직은 여기에 유지
 * - Cross Domain 로직은 cross-domain usecase로 위임
 * - In Domain 협력 로직은 in-domain usecase로 위임
 */
@Injectable()
export class UserFacade {
  constructor(
    private readonly userService: UserService,
    private readonly userWalletUsecase: UserWalletUsecase,
    private readonly userAddressUsecase: UserAddressUsecase,
  ) {}

  // ==================== 계정 생성 (Cross Domain) ====================

  // 내 계정 생성 (Cross Domain)
  async createMyAccount(params: CreateUserParams) {
    return await this.userWalletUsecase.createMyAccount(params);
  }

  // ==================== 내 정보 관리 ====================

  // 내 정보 조회 (Cross Domain)
  async getMyInfo(userId: string) {
    return await this.userWalletUsecase.getMyInfo(userId);
  }

  // 내 정보 수정
  async updateMyInfo(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UpdateMyInfoResponseDto> {
    const updatedUser = await this.userService.updateUser(userId, dto);

    return UpdateMyInfoResponseDto.from(updatedUser);
  }

  // 회원 탈퇴
  async deleteMyAccount(userId: string): Promise<DeleteAccountResponseDto> {
    await this.userService.deleteUser(userId);

    return DeleteAccountResponseDto.from();
  }

  // ==================== 주소 관리 (In Domain) ====================

  // 내 주소 목록 조회 (In Domain)
  async getMyAddresses(userId: string) {
    return await this.userAddressUsecase.getMyAddresses(userId);
  }

  // 기본 배송지 조회 (In Domain)
  async getMyDefaultAddress(userId: string) {
    return await this.userAddressUsecase.getMyDefaultAddress(userId);
  }

  // 주소 생성 (In Domain)
  async createMyAddress(userId: string, dto: CreateAddressDto) {
    return await this.userAddressUsecase.createMyAddress(userId, dto);
  }

  // 주소 수정 (In Domain)
  async updateMyAddress(
    userId: string,
    addressId: number,
    dto: UpdateAddressDto,
  ) {
    return await this.userAddressUsecase.updateMyAddress(
      userId,
      addressId,
      dto,
    );
  }

  // 기본 배송지 설정 (In Domain)
  async setMyDefaultAddress(userId: string, addressId: number) {
    return await this.userAddressUsecase.setMyDefaultAddress(userId, addressId);
  }

  // 주소 삭제 (In Domain)
  async deleteMyAddress(userId: string, addressId: number) {
    return await this.userAddressUsecase.deleteMyAddress(userId, addressId);
  }
}
