import { Module } from '@nestjs/common';
import { ProductsController } from './product.controller';
import { ProductsService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../utils/cloudinary.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, CloudinaryService],
})
export class ProductsModule {}
