import { Controller, Get, Post, Body } from '@nestjs/common';
import { Role } from '@/modules/user/domain/entity/user.entity';
import { RBAC } from '@/modules/auth/decorators/rbac.decorator';
import { UserInfo } from '@/modules/user/presentation/decorators/user-info.decorator';
import { Payload } from '@/common/types/express';
import { WalletFacade } from '../../application/wallet.facade';
import { ChargeWalletDto } from '../dto';

@RBAC([Role.RETAILER, Role.WHOLESALER])
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletFacade: WalletFacade) {}

  /**
   * 지갑 잔액 조회
   * GET /wallet/balance
   */
  @Get('balance')
  async getBalance(@UserInfo() user: Payload) {
    return this.walletFacade.getBalance(user.sub);
  }

  /**
   * 지갑 충전
   * POST /wallet/charge
   */
  @Post('charge')
  async charge(@UserInfo() user: Payload, @Body() dto: ChargeWalletDto) {
    const result = await this.walletFacade.chargeWallet(user.sub, dto);
    return {
      message: '지갑이 충전되었습니다.',
      data: result,
    };
  }

  /**
   * 지갑 사용 내역 조회
   * GET /wallet/history
   */
  @Get('history')
  async getHistory(@UserInfo() user: Payload) {
    return this.walletFacade.getHistories(user.sub);
  }
}
