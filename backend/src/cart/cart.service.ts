import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartDto } from './dto/add-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async addToCart(userId: string, dto: AddCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.product_id },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.prisma.cart.findFirst({
      where: { userId, productId: dto.product_id },
    });

    if (existing) {
      return this.prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity },
      });
    }

    return this.prisma.cart.create({
      data: {
        userId,
        productId: dto.product_id,
        quantity: dto.quantity,
      },
    });
  }

  async getCart(userId: string) {
    const cart = await this.prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!cart.length) throw new NotFoundException('Cart is empty');

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return { cart, total };
  }

  async updateQuantity(cartId: string, dto: UpdateCartDto) {
    const existing = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!existing) throw new NotFoundException('Cart item not found');

    return this.prisma.cart.update({
      where: { id: cartId },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(cartId: string) {
    const existing = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!existing) throw new NotFoundException('Cart item not found');

    await this.prisma.cart.delete({ where: { id: cartId } });
    return { message: 'Item removed successfully' };
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({ where: { userId } });
    return { message: 'Cart cleared' };
  }
}
