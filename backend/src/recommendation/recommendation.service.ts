import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product } from '@prisma/client';

/**
 * Simple rule-based recommendations:
 * - For a user: find categories from user's past orders and cart, then pick other products from those categories.
 * - For top-selling: aggregate OrderItem to return products ordered most.
 */
@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Get personalized recommendations for a user (limit default 8)
  async getRecommendationsForUser(userId: string, limit = 8): Promise<Product[]> {
    // 1) Get productIds user already bought
    const purchasedItems = await this.prisma.orderItem.findMany({
      where: { order: { userId } },
      select: { productId: true },
      distinct: ['productId'],
    });
    const purchasedProductIds = purchasedItems.map((p) => p.productId);

    // 2) Get items currently in cart
    const cartItems = await this.prisma.cart.findMany({ where: { userId }, select: { productId: true } });
    const cartProductIds = cartItems.map((c) => c.productId);

    // 3) Collect categories from those products
    const productIdsToCheck = [...new Set([...purchasedProductIds, ...cartProductIds])];
    if (productIdsToCheck.length === 0) {
      // fallback to top-selling
      return this.getTopSelling(limit);
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIdsToCheck } },
      select: { category: true },
    });
    
    // Fix: Filter out null categories and cast to string[]
    const categories = Array.from(
      new Set(products.map((p) => p.category).filter((cat): cat is string => cat !== null))
    );

    if (categories.length === 0) {
      return this.getTopSelling(limit);
    }

    // 4) Find other products in those categories excluding ones already purchased / in cart
    const recs = await this.prisma.product.findMany({
      where: {
        AND: [
          { category: { in: categories } },
          { id: { notIn: [...new Set([...purchasedProductIds, ...cartProductIds])] } },
          { stock: { gt: 0 } }, // optional: only recommend products in stock
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // If not enough recommendations, fill with top-selling
    if (recs.length < limit) {
      const top = await this.getTopSelling(limit - recs.length);
      // avoid duplicates - Fix: Use type guard to filter out undefined
      const combined = recs.concat(
        top.filter((t): t is Product => 
          t !== undefined && !recs.find((r) => r.id === t.id)
        )
      );
      return combined;
    }

    return recs;
  }

  // Recommend based on a product (e.g., product detail page)
  async getRecommendationsForProduct(productId: string, limit = 8): Promise<Product[]> {
    const product = await this.prisma.product.findUnique({ 
      where: { id: productId }, 
      select: { category: true } 
    });
    
    if (!product || !product.category) return this.getTopSelling(limit);

    const recs = await this.prisma.product.findMany({
      where: { 
        category: product.category, 
        id: { not: productId }, 
        stock: { gt: 0 } 
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    if (recs.length < limit) {
      const top = await this.getTopSelling(limit - recs.length);
      // Fix: Use type guard to filter out undefined
      return recs.concat(
        top.filter((t): t is Product => 
          t !== undefined && !recs.find((r) => r.id === t.id)
        )
      );
    }

    return recs;
  }

  // Top selling products aggregated by sum(quantity) on orderItem
  async getTopSelling(limit = 8): Promise<Product[]> {
    // Using groupBy to sum quantities per product
    const groups = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = groups.map((g) => g.productId);
    if (productIds.length === 0) {
      // fallback: recent products
      return this.prisma.product.findMany({ 
        take: limit, 
        orderBy: { createdAt: 'desc' } 
      });
    }

    // fetch product objects in the same order as groups
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // preserve ordering by productIds and filter out undefined
    const byId = new Map(products.map((p) => [p.id, p]));
    return productIds
      .map((id) => byId.get(id))
      .filter((product): product is Product => product !== undefined);
  }
}