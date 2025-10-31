import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import type { UpdateUserDto } from './dto/update-user.dto';
import { Request as Req } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMyInfo(@Request() req: Req) {
    const { user } = req;

    if (!user || !user.sub) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.userService.getMyInfo(user.sub);
  }

  @Patch('me')
  updateMyInfo(@Request() req: Req, @Body() updateUserDto: UpdateUserDto) {
    const { user } = req;

    if (!user || !user.sub) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.userService.updateMyInfo(user.sub, updateUserDto);
  }

  @Delete('me')
  deleteMyAccount(@Request() req: Req) {
    const { user } = req;

    if (!user || !user.sub) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.userService.deleteMyAccount(user.sub);
  }
}
