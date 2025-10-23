// src/analytics/analytics.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addDays, parseISO, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseRange(from?: string, to?: string) {
    const now = new Date();
    const start = from ? parseISO(from) : addDays(now, -30);
    const end = to ? parseISO(to) : now;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid from/to date');
    }
    if (start > end) throw new BadRequestException('`from` must be before `to`');
    return { start, end };
  }

  // Overview: totalRevenue, totalOrders, activeCustomers, avgOrderValue, totalItemsSold
  async getOverview(from?: string, to?: string) {
    const { start, end } = this.parseRange(from, to);

    // total revenue & orders
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
      },
      select: { id: true, total: true, userId: true },
    });

    const totalRevenue = orders.reduce((s, o) => s + (o.total ?? 0), 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map((o) => o.userId)).size;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    // total items sold (sum of orderItem.quantity in range)
    const itemsAgg = await this.prisma.orderItem.aggregate({
      where: {
        order: {
          createdAt: { gte: start, lte: end },
        },
      },
      _sum: { quantity: true },
    });

    const totalItemsSold = itemsAgg._sum.quantity ?? 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue: Number(avgOrderValue.toFixed(2)),
      totalItemsSold,
      uniqueCustomers,
    };
  }

  // Sales trend aggregated by day or month
  async getSalesTrend(from?: string, to?: string, groupBy: 'day' | 'month' = 'day') {
    const { start, end } = this.parseRange(from, to);

    // fetch orders within range (lightweight)
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });

    // bucket in JS (date-fns format)
    const buckets = new Map<string, { date: string; revenue: number; orders: number }>();
    for (const o of orders) {
      const key = groupBy === 'month' ? format(o.createdAt, 'yyyy-MM') : format(o.createdAt, 'yyyy-MM-dd');
      const cur = buckets.get(key) ?? { date: key, revenue: 0, orders: 0 };
      cur.revenue += o.total ?? 0;
      cur.orders += 1;
      buckets.set(key, cur);
    }

    // produce array sorted by key (ascending)
    const result = Array.from(buckets.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
    return result;
  }

  // Top-selling products in range
  async getTopProducts(limit = 10, from?: string, to?: string) {
    const { start, end } = this.parseRange(from, to);

    // Group order items by productId and sum quantity
    // prisma.groupBy works for this use-case
    const groups = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { createdAt: { gte: start, lte: end } },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = groups.map((g) => g.productId);
    if (productIds.length === 0) {
      // fallback: recent products
      return this.prisma.product.findMany({ take: limit, orderBy: { createdAt: 'desc' } });
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const byId = new Map(products.map((p) => [p.id, p]));
    // return objects in same order as groups with soldCount
    return groups.map((g) => ({
      product: byId.get(g.productId),
      sold: g._sum.quantity ?? 0,
    }));
  }
}
