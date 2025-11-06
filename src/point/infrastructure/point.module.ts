import { Module } from '@nestjs/common';
import { PointService } from '../domain/service/point.service';
import { POINT_REPOSITORY } from '../domain/interface/point.repository.interface';
import { POINT_HISTORY_REPOSITORY } from '../domain/interface/point-history.repository.interface';
import { PointRepository } from './point.repository';
import { PointHistoryRepository } from './point-history.repository';
import { PointFacade } from '../application/point.facade';
import { PointController } from '../presentation/controller/point.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PointController],
  providers: [
    PointService,
    PointFacade,
    {
      provide: POINT_REPOSITORY,
      useClass: PointRepository,
    },
    {
      provide: POINT_HISTORY_REPOSITORY,
      useClass: PointHistoryRepository,
    },
  ],
  exports: [PointService, PointFacade],
})
export class PointModule {}
