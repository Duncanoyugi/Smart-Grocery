// src/analytics/analytics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DateRangeDto } from './dto/date-range.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // GET /analytics/overview?from=2025-01-01&to=2025-01-31
  @Get('overview')
  @Roles('ADMIN')
  async overview(@Query() query: DateRangeDto) {
    return this.analyticsService.getOverview(query.from, query.to);
  }

  // GET /analytics/sales-trend?from=...&to=...&groupBy=day|month
  @Get('sales-trend')
  @Roles('ADMIN')
  async salesTrend(@Query() query: DateRangeDto) {
    const group = (query.groupBy as 'day' | 'month') || 'day';
    return this.analyticsService.getSalesTrend(query.from, query.to, group);
  }

  // GET /analytics/top-products?from=...&to=...&limit=10
  @Get('top-products')
  @Roles('ADMIN')
  async topProducts(@Query('limit') limit = '10', @Query() query: DateRangeDto) {
    const n = Number(limit) || 10;
    return this.analyticsService.getTopProducts(n, query.from, query.to);
  }
}
