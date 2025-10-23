import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class InventoryTasksService {
  private readonly logger = new Logger(InventoryTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM) // Runs every day at 10 AM
  async checkAllProductsForLowStock() {
    this.logger.log('Running daily low stock check...');

    const products = await this.prisma.product.findMany({
      where: {
        stock: {
          lte: 10, // Check products with stock <= 10
        },
      },
      include: {
        store: {
          include: {
            owner: true,
          },
        },
      },
    });

    for (const product of products) {
      const lowStockThreshold = product.reorderLevel || product.lowStockThreshold || 10;
      
      if (product.stock <= lowStockThreshold) {
        const message = `Daily low stock alert: ${product.name} has only ${product.stock} units left (threshold: ${lowStockThreshold})`;
        
        try {
          await this.notificationService.createNotificationForOwner(
            product.storeId,
            message,
            true
          );
        } catch (error) {
          this.logger.error(`Failed to send daily low stock notification for product ${product.name}: ${error.message}`);
        }
      }
    }

    this.logger.log(`Daily low stock check completed. Checked ${products.length} products.`);
  }
}