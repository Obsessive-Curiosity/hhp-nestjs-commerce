import { Controller, Get, Patch, Delete, Body, Request } from '@nestjs/common';
import { UserFacadeService as UserService } from '../application/user.facade';
import { UserInfo } from './decorators/user-info.decorator';
import { Payload } from '@/types/express';
import type { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMyInfo(@UserInfo() user: Payload) {
    return this.userService.getMyInfo(user.sub);
  }

  @Patch('me')
  updateMyInfo(
    @UserInfo() user: Payload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateMyInfo(user.sub, updateUserDto);
  }

  @Delete('me')
  deleteMyAccount(@UserInfo() user: Payload) {
    return this.userService.deleteMyAccount(user.sub);
  }
}
