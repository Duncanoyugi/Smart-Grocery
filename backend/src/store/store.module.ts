import { Module } from '@nestjs/common';
import { StoresController } from './store.controller';
import { StoresService } from './store.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [StoresController],
  providers: [StoresService, PrismaService],
  exports: [StoresService],
})
export class StoresModule {}