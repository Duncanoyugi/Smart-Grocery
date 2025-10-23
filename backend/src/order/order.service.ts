import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private readonly notificationService: NotificationService, // Add NotificationService
  ) {}

  async placeOrder(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cartItems = await this.prisma.cart.findMany({
      where: { userId },
      include: { product: { include: { store: true } } }, // Include store info
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    // Use transaction to ensure data consistency
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order first
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDING',
        },
      });

      // Process each cart item and update product stock
      for (const item of cartItems) {
        // Update product stock
        const product = await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        // Check if stock goes negative
        if (product.stock < 0) {
          throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock + item.quantity}, requested: ${item.quantity}`);
        }

        // ✅ UPDATED: Check low stock threshold and send notification
        const lowStockThreshold = product.reorderLevel || product.lowStockThreshold || 10;
        if (product.stock <= lowStockThreshold) {
          this.logger.log(`⚠️ Low stock alert: ${product.name} has only ${product.stock} left!`);
          
          // Send low stock notification
          try {
            const message = `Low stock alert after order: ${product.name} has only ${product.stock} units left (threshold: ${lowStockThreshold})`;
            
            // Use the product's store information from the included relation
            await this.notificationService.createNotificationForOwner(
              product.storeId,
              message,
              true // send email
            );
            
            this.logger.log(`Low stock notification sent for product: ${product.name}`);
          } catch (error) {
            this.logger.error(`Failed to send low stock notification: ${error.message}`);
            // Don't throw error here - order should still complete
          }
        }

        // Create order item
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        });
      }

      // Clear cart after successful order creation
      await tx.cart.deleteMany({ where: { userId } });

      // Return the complete order with items
      return tx.order.findUnique({
        where: { id: order.id },
        include: { 
          items: {
            include: { product: true } 
          } 
        },
      });
    });

    return order;
  }

  async getUserOrders(userId: string) {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.order.findMany({
      where: { userId },
      include: { 
        items: {
          include: { product: true } 
        } 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Optional: Get order by ID
  async getOrderById(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        userId // Ensure user can only access their own orders
      },
      include: { 
        items: { 
          include: { product: true } 
        } 
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // Optional: Cancel order
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { 
        id: orderId,
        userId 
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Order is already cancelled');
    }

    if (order.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: { 
        items: { 
          include: { product: true } 
        } 
      },
    });

    return updatedOrder;
  }

  // Admin: View all orders
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: Update order status
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}