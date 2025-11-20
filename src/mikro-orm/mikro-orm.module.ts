import { Module } from '@nestjs/common';
import { MikroOrmModule as NestMikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './mikro-orm.config.js';

@Module({
  imports: [NestMikroOrmModule.forRoot(mikroOrmConfig)],
})
export class MikroOrmModule {}
