import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryService } from './inventory.service';

@Injectable()
export class InventoryJob {
  private readonly logger = new Logger(InventoryJob.name);
  constructor(private readonly inventoryService: InventoryService) {}

  // run once per day at 8:00am server time — adjust as needed
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyInventoryCheck() {
    this.logger.log('Running daily inventory check job...');
    try {
      await this.inventoryService.sendInventoryAlerts();
      this.logger.log('Inventory alerts processed.');
    } catch (err) {
      this.logger.error('Inventory check failed: ' + err.message);
    }
  }
}
