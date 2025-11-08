import { Controller, Get, Post, Body } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RBAC } from '@/auth/decorators/rbac.decorator';
import { UserInfo } from '@/user/presentation/decorators/user-info.decorator';
import { Payload } from '@/types/express';
import { PointFacade } from '../../application/point.facade';
import { ChargePointDto } from '../dto/charge-point.dto';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('point')
export class PointController {
  constructor(private readonly pointFacade: PointFacade) {}

  /**
   * 포인트 잔액 조회
   * GET /point/balance
   */
  @Get('balance')
  async getBalance(@UserInfo() user: Payload) {
    return this.pointFacade.getBalance(user.sub);
  }

  /**
   * 포인트 충전
   * POST /point/charge
   */
  @Post('charge')
  async charge(@UserInfo() user: Payload, @Body() dto: ChargePointDto) {
    const result = await this.pointFacade.charge(user.sub, dto);
    return {
      message: '포인트가 충전되었습니다.',
      data: result,
    };
  }

  /**
   * 포인트 사용 내역 조회
   * GET /point/history
   */
  @Get('history')
  async getHistory(@UserInfo() user: Payload) {
    return this.pointFacade.getHistories(user.sub);
  }
}
