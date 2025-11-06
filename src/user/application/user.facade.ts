import { Injectable } from '@nestjs/common';
import { UserService } from '../domain/service/user.service';
import { UpdateUserDto } from '../presentation/dto';
import { PointService } from '@/point/domain/service/point.service';

@Injectable()
export class UserFacadeService {
  constructor(
    private readonly userService: UserService,
    private readonly pointService: PointService,
  ) {}

  // 내 정보 조회
  async getMyInfo(userId: string) {
    const user = await this.userService.getUserById(userId);
    const pointBalance = await this.pointService.getBalance(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      point: pointBalance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // 내 정보 수정
  async updateMyInfo(userId: string, dto: UpdateUserDto) {
    const updatedUser = await this.userService.updateUserInfo(userId, dto);

    return {
      message: '회원 정보가 수정되었습니다.',
      user: {
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  // 회원 탈퇴
  async deleteMyAccount(userId: string) {
    await this.userService.deleteUser(userId);

    return {
      message: '회원 탈퇴가 완료되었습니다.',
    };
  }
}
