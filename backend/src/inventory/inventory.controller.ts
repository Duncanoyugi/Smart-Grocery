import { Controller, Get, Patch, Param, Body, UseGuards, Req, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { RestockDto } from './dto/restock.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  // GET /inventory/store/:storeId  -> owner/admin only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('store/:storeId')
  async getStoreInventory(@Req() req, @Param('storeId') storeId: string) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.inventory.getStoreInventory(userId, storeId);
  }

  // PATCH /inventory/product/:productId/adjust  -> ADMIN or owner
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('product/:productId/adjust')
  async adjustStock(@Req() req, @Param('productId') productId: string, @Body() dto: AdjustStockDto) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.inventory.adjustStock(userId, productId, dto);
  }

  // POST /inventory/product/:productId/restock  -> ADMIN or owner
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('product/:productId/restock')
  async restock(@Req() req, @Param('productId') productId: string, @Body() dto: RestockDto) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.inventory.restockProduct(userId, productId, dto);
  }

  // GET /inventory/alerts -> admin gets all stores; owners get only their store results
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('alerts')
  async getAlerts(@Req() req) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.inventory.getAlertsForUser(userId);
  }

  // GET /inventory/low-stock -> Get low stock products
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('low-stock')
  async getLowStockProducts() {
    return this.inventory.getLowStockProducts();
  }
}