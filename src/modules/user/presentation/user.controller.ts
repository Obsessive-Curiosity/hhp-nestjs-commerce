import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UserFacade } from '../application/user.facade';
import { UserInfo } from './decorators/user-info.decorator';
import { Payload } from '@/common/types/express';
import { UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dto';
import { RBAC } from '@/modules/auth/decorators/rbac.decorator';
import { Role } from '@/modules/user/domain/entity/user.entity';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('user')
export class UserController {
  constructor(private readonly userFacade: UserFacade) {}

  @Get('me')
  getMyInfo(@UserInfo() user: Payload) {
    return this.userFacade.getMyInfo(user.sub);
  }

  @Patch('me')
  updateMyInfo(
    @UserInfo() user: Payload,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userFacade.updateMyInfo(user.sub, updateUserDto);
  }

  @Delete('me')
  deleteMyAccount(@UserInfo() user: Payload) {
    return this.userFacade.deleteMyAccount(user.sub);
  }

  // ==================== 주소 관리 ====================

  @Get('me/address')
  getMyAddresses(@UserInfo() user: Payload) {
    return this.userFacade.getMyAddresses(user.sub);
  }

  @Get('me/address/default')
  getMyDefaultAddress(@UserInfo() user: Payload) {
    return this.userFacade.getMyDefaultAddress(user.sub);
  }

  @Post('me/address')
  createMyAddress(
    @UserInfo() user: Payload,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.userFacade.createMyAddress(user.sub, createAddressDto);
  }

  @Patch('me/address/:id')
  updateMyAddress(
    @UserInfo() user: Payload,
    @Param('id', ParseIntPipe) addressId: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.userFacade.updateMyAddress(
      user.sub,
      addressId,
      updateAddressDto,
    );
  }

  @Patch('me/address/:id/default')
  setMyDefaultAddress(
    @UserInfo() user: Payload,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    return this.userFacade.setMyDefaultAddress(user.sub, addressId);
  }

  @Delete('me/address/:id')
  deleteMyAddress(
    @UserInfo() user: Payload,
    @Param('id', ParseIntPipe) addressId: number,
  ) {
    return this.userFacade.deleteMyAddress(user.sub, addressId);
  }
}
