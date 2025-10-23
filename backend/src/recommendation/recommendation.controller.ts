import { Controller, Get, Query, UseGuards, Req, Param } from '@nestjs/common';
import { RecommendationsService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  // GET /recommendations -> personalized for logged-in user
  @UseGuards(JwtAuthGuard)
  @Get()
  async forUser(@Req() req, @Query('limit') limit?: string) {
    const userId = req.user?.id ?? req.user?.sub;
    const n = limit ? Number(limit) : 8;
    return this.recommendationsService.getRecommendationsForUser(userId, n);
  }

  // GET /recommendations/product/:id -> recommendations for a product page
  @Get('product/:id')
  async forProduct(@Param('id') id: string, @Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 8;
    return this.recommendationsService.getRecommendationsForProduct(id, n);
  }

  // GET /recommendations/top -> top selling products
  @Get('top')
  async top(@Query('limit') limit?: string) {
    const n = limit ? Number(limit) : 8;
    return this.recommendationsService.getTopSelling(n);
  }
}
