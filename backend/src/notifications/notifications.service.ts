import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService, private readonly mailer: MailerService) {}

  // create a notification record and (optionally) email the recipient
  async createNotificationForOwner(storeId: string, message: string, sendEmail = true) {
    // find store + owner
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { owner: true },
    });

    if (!store) {
      this.logger.warn(`createNotificationForOwner: store ${storeId} not found`);
      return null;
    }

    const notif = await this.prisma.notification.create({
      data: {
        storeId,
        userId: store.ownerId,
        message,
        type: 'LOW_STOCK',
      },
    });

    // send email if owner has email configured
    if (sendEmail && store.owner?.email) {
      try {
        const subject = `Low stock alert — ${store.name}`;
        const html = `
          <p>Hi ${store.owner.name || 'Store Owner'},</p>
          <p>${message}</p>
          <p><small>This is an automated alert from Smart Grocery.</small></p>
        `;
        // prefer a public method on MailerService that sends arbitrary html
        if (typeof this.mailer['sendHtmlEmail'] === 'function') {
          await this.mailer['sendHtmlEmail'](store.owner.email, subject, html);
        } else {
          // fallback to existing public methods (if any)
          await this.mailer.sendOtpEmail(store.owner.email, store.owner.name, message); // crude fallback if no generic send
        }
      } catch (err) {
        this.logger.error('Failed to send low-stock email: ' + err?.message);
      }
    }

    return notif;
  }

  async getNotificationsForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}
