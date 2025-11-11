import { Module } from '@nestjs/common';
import { MikroOrmModule as NestMikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './mikro-orm.config';

@Module({
  imports: [NestMikroOrmModule.forRoot(mikroOrmConfig)],
  exports: [NestMikroOrmModule],
})
export class MikroOrmModule {}
