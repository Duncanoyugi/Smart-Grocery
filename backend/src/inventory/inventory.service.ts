import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { RestockDto } from './dto/restock.dto';
import { MailerService } from '../mailer/mailer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  // Get all products for a store (owner/admin)
  async getStoreInventory(requestingUserId: string, storeId: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    return this.prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Adjust stock up or down (owner/admin)
  async adjustStock(requestingUserId: string, productId: string, dto: AdjustStockDto) {
    const product = await this.prisma.product.findUnique({ 
      where: { id: productId }, 
      include: { store: true } 
    });
    if (!product) throw new NotFoundException('Product not found');

    const user = await this.prisma.user.findUnique({ where: { id: requestingUserId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== 'ADMIN' && product.store.ownerId !== requestingUserId) {
      throw new ForbiddenException('Not authorized to adjust this product');
    }

    const newStock = product.stock + dto.change;
    if (newStock < 0) throw new BadRequestException('Resulting stock cannot be negative');

    try {
      const [updatedProduct, history] = await this.prisma.$transaction([
        this.prisma.product.update({
          where: { id: productId },
          data: { stock: newStock },
        }),
        this.prisma.stockHistory.create({
          data: {
            productId,
            change: dto.change,
            reason: dto.reason || (dto.change > 0 ? 'Restock/adjust' : 'Consumption/adjust'),
            createdBy: requestingUserId,
          },
        }),
      ]);

      return { product: updatedProduct, history };
    } catch (err) {
      throw new InternalServerErrorException('Failed to update stock: ' + err.message);
    }
  }

  // Restock endpoint (wrapper around adjustStock with positive quantity)
  async restockProduct(requestingUserId: string, productId: string, dto: RestockDto) {
    const adjustDto = { change: dto.quantity, reason: dto.reason };
    return this.adjustStock(requestingUserId, productId, adjustDto);
  }

  // Get alerts: low-stock (<= reorderLevel) and expiring soon
  async getAlertsForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let storeFilter = {};
    if (user.role !== 'ADMIN') {
      const store = await this.prisma.store.findUnique({ where: { ownerId: userId } });
      if (!store) return { lowStock: [], expiringSoon: [] };
      storeFilter = { storeId: store.id };
    }

    const expiryDays = Number(this.config.get<number>('INVENTORY_EXPIRY_DAYS', 7));
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + expiryDays);
    const defaultThreshold = Number(this.config.get<number>('INVENTORY_DEFAULT_REORDER', 5));

    // Get products with reorderLevel and filter in JavaScript
    const productsWithReorder = await this.prisma.product.findMany({
      where: {
        AND: [storeFilter, { reorderLevel: { not: null } }],
      },
    });
    const lowStockFromReorder = productsWithReorder.filter((p) => p.stock <= (p.reorderLevel ?? defaultThreshold));

    // Get products with no reorderLevel but stock <= default threshold
    const lowStockNoReorder = await this.prisma.product.findMany({
      where: {
        AND: [storeFilter, { reorderLevel: null, stock: { lte: defaultThreshold } }],
      },
    });

    const lowStockCombined = [...lowStockFromReorder, ...lowStockNoReorder];

    // Expiring soon products
    const expiringSoon = await this.prisma.product.findMany({
      where: {
        AND: [storeFilter, { expiryDate: { lte: expiryThreshold, not: null } }],
      },
    });

    return {
      lowStock: lowStockCombined,
      expiringSoon,
    };
  }

  // Send alerts by email
  async sendInventoryAlerts() {
    const stores = await this.prisma.store.findMany({ include: { owner: true } });
    const expiryDays = Number(this.config.get<number>('INVENTORY_EXPIRY_DAYS', 7));
    const defaultThreshold = Number(this.config.get<number>('INVENTORY_DEFAULT_REORDER', 5));
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + expiryDays);

    for (const store of stores) {
      const lowStockFromReorder = (await this.prisma.product.findMany({
        where: { storeId: store.id, reorderLevel: { not: null } },
      })).filter((p) => p.stock <= (p.reorderLevel ?? defaultThreshold));

      const lowStockNoReorder = await this.prisma.product.findMany({
        where: { storeId: store.id, reorderLevel: null, stock: { lte: defaultThreshold } },
      });

      const lowStock = [...lowStockFromReorder, ...lowStockNoReorder];
      const expiringSoon = await this.prisma.product.findMany({
        where: { storeId: store.id, expiryDate: { lte: expiryThreshold, not: null } },
      });

      if (lowStock.length === 0 && expiringSoon.length === 0) continue;

      const to = store.owner.email;
      const name = store.owner.name || 'Store Owner';
      const lowStockList = lowStock.map((p) => 
        `${p.name} — stock: ${p.stock} ${p.reorderLevel ? `(reorderLevel: ${p.reorderLevel})` : ''}`
      ).join('<br/>');
      const expiringList = expiringSoon.map((p) => 
        `${p.name} — expires: ${p.expiryDate?.toISOString().slice(0,10)}`
      ).join('<br/>');

      try {
        await this.mailer.sendHtmlEmail(
          to,
          `Inventory alerts for ${store.name}`,
          `<p>Hi ${name},</p>
            ${lowStock.length ? `<h3>Low stock:</h3><p>${lowStockList}</p>` : ''}
            ${expiringSoon.length ? `<h3>Expiring soon (next ${expiryDays} days):</h3><p>${expiringList}</p>` : ''}
            <p>— Smart Grocery</p>`
        );
      } catch (err) {
        console.error(`Failed to send inventory alert to ${to}:`, err.message);
      }
    }
  }
  async getLowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        stock: { lte: 10 },
      },
      include: {
        store: true,
      },
    });
  }
}