import { Module } from '@nestjs/common';
import { MikroOrmModule as NestMikroOrmModule } from '@mikro-orm/nestjs';
import { UserRepository } from './user.repository';
import { AddressRepository } from './address.repository';
import { UserController } from '../presentation/user.controller';
import { UserService } from '../domain/service/user.service';
import { AddressService } from '../domain/service/address.service';
import { UserFacade } from '../application/user.facade';
import { UserWalletUsecase } from '../application/cross-domain/user-wallet.usecase';
import { UserAddressUsecase } from '../application/in-domain/user-address.usecase';
import { USER_REPOSITORY } from '../domain/interface/user.repository.interface';
import { ADDRESS_REPOSITORY } from '../domain/interface/address.repository.interface';
import { PasswordService } from '../domain/service/password.service';
import { WalletModule } from '@/wallet/infrastructure/wallet.module';
import { User } from '../domain/entity/user.entity';
import { Address } from '../domain/entity/address.entity';

@Module({
  imports: [NestMikroOrmModule.forFeature([User, Address]), WalletModule],
  controllers: [UserController],
  providers: [
    // Facade
    UserFacade,

    // Usecases
    UserWalletUsecase,
    UserAddressUsecase,

    // Domain Services
    UserService,
    AddressService,
    PasswordService,

    // Repositories
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: ADDRESS_REPOSITORY,
      useClass: AddressRepository,
    },
  ],
  exports: [UserFacade, UserService, AddressService, PasswordService, USER_REPOSITORY],
})
export class UserModule {}
