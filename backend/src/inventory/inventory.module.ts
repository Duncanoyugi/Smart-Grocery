import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { InventoryJob } from './inventory.job';

@Module({
  imports: [ConfigModule, ScheduleModule.forRoot()],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, MailerService, InventoryJob],
  exports: [InventoryService],
})
export class InventoryModule {}
