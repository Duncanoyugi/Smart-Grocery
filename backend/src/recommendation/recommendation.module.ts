import { Module } from '@nestjs/common';
import { RecommendationsService } from './recommendation.service';
import { RecommendationsController } from './recommendation.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RecommendationsController],
  providers: [RecommendationsService, PrismaService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
