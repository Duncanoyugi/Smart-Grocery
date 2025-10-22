import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  UseGuards,
  Req,
  ParseUUIDPipe,
  Delete,
  Patch,
  Body,
  ForbiddenException
} from '@nestjs/common';
import { OrdersService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard) // Protect all order routes
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('place')
  async placeOrder(@Req() req) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.ordersService.placeOrder(userId);
  }

  @Get('my-orders')
  async getUserOrders(@Req() req) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  async getOrderById(@Req() req, @Param('id', ParseUUIDPipe) orderId: string) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Delete(':id/cancel')
  async cancelOrder(@Req() req, @Param('id', ParseUUIDPipe) orderId: string) {
    const userId = req.user?.id ?? req.user?.sub;
    return this.ordersService.cancelOrder(orderId, userId);
  }

  // Admin: view all orders
  @Get()
  async getAllOrders(@Req() req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Access denied');
    return this.ordersService.getAllOrders(); // ← FIX: Changed orderService to ordersService
  }

  // Admin: update order status
  @Patch(':id/status')
  async updateOrderStatus(
    @Req() req, 
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() body: { status: string }
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Access denied');
    return this.ordersService.updateOrderStatus(id, body.status); // ← FIX: Changed orderService to ordersService
  }
}