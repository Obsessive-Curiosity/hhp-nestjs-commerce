import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { WalletService } from '../domain/service/wallet.service';
import { WalletHistoryService } from '../domain/service/wallet-history.service';
import { WALLET_REPOSITORY } from '../domain/interface/wallet.repository.interface';
import { WALLET_HISTORY_REPOSITORY } from '../domain/interface/wallet-history.repository.interface';
import { WalletRepository } from './wallet.repository';
import { WalletHistoryRepository } from './wallet-history.repository';
import { WalletFacade } from '../application/wallet.facade';
import { WalletController } from '../presentation/controller/wallet.controller';
import { Wallet } from '../domain/entity/wallet.entity';
import { WalletHistory } from '../domain/entity/wallet-history.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Wallet, WalletHistory])],
  controllers: [WalletController],
  providers: [
    WalletService,
    WalletHistoryService,
    WalletFacade,
    {
      provide: WALLET_REPOSITORY,
      useClass: WalletRepository,
    },
    {
      provide: WALLET_HISTORY_REPOSITORY,
      useClass: WalletHistoryRepository,
    },
  ],
  exports: [WalletService, WalletHistoryService],
})
export class WalletModule {}
