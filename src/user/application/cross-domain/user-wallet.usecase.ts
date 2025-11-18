import { Injectable } from '@nestjs/common';
import {
  UserService,
  CreateUserParams,
} from '../../domain/service/user.service';
import { WalletService } from '@/wallet/domain/service/wallet.service';
import { CreateAccountResponseDto, GetMyInfoResponseDto } from '../dto';

/**
 * Cross Domain Usecase
 * User 도메인과 Wallet 도메인 간의 협력 로직
 */
@Injectable()
export class UserWalletUsecase {
  constructor(
    private readonly userService: UserService,
    private readonly walletService: WalletService,
  ) {}

  // 계정 생성 (사용자 생성 + 지갑 초기화)
  async createMyAccount(
    params: CreateUserParams,
  ): Promise<CreateAccountResponseDto> {
    // 1. 사용자 생성 (User Domain)
    const user = await this.userService.createUser(params);

    // 2. 지갑 초기화 (Wallet Domain)
    await this.walletService.createWallet(user.id);

    return CreateAccountResponseDto.from(user);
  }

  // 내 정보 조회 (사용자 정보 + 지갑 잔액)
  async getMyInfo(userId: string): Promise<GetMyInfoResponseDto> {
    // 1. 사용자 정보 조회 (User Domain)
    const user = await this.userService.getUserById(userId);

    // 2. 지갑 잔액 조회 (Wallet Domain)
    const walletBalance = await this.walletService.getBalance(userId);

    return GetMyInfoResponseDto.from(user, walletBalance);
  }
}
