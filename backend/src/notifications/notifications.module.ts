import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { NotificationController } from './notifications.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';

@Module({
  imports: [],
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, MailerService],
  exports: [NotificationService],
})
export class NotificationsModule {}
