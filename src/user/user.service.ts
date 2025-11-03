import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async recordLogin(userId: string) {
    if (!userId) return;

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async getMyInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        point: {
          select: {
            amount: true,
          },
        },
        businessInfo: {
          select: {
            businessNumber: true,
            businessName: true,
            verified: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const { point, ...rest } = user;

    return {
      ...rest,
      pointAmount: point?.amount ?? 0,
    };
  }

  async updateMyInfo(userId: string, dto: UpdateUserDto) {
    const { name, phone, password } = dto;
    const updateData = { name, phone, password };

    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (password) {
      const salt = await bcrypt.genSalt();
      updateData.password = await bcrypt.hash(password, salt);
    }

    // 정보 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        updatedAt: true,
      },
    });

    return {
      message: '회원 정보가 수정되었습니다.',
      user: updatedUser,
    };
  }

  async deleteMyAccount(userId: string) {
    // 사용자 존재 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!existingUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    return {
      message: '회원 탈퇴가 완료되었습니다.',
    };
  }
}
