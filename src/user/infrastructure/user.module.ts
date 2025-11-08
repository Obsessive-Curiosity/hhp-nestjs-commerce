import { Module } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserController } from '../presentation/user.controller';
import { UserService } from '../domain/service/user.service';
import { UserFacadeService } from '../application/user.facade';
import { USER_REPOSITORY } from '../domain/interface/user.repository.interface';
import { PasswordService } from '../domain/service/password.service';
import { PointModule } from '@/point/infrastructure/point.module';

@Module({
  imports: [PrismaModule, PointModule],
  controllers: [UserController],
  providers: [
    UserFacadeService,
    UserService,
    PasswordService,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
