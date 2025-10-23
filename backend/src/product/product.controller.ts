import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Req,
  Get,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateProductDto, @Req() req) {
    return this.productsService.createProduct(req.user.sub, file, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    return this.productsService.updateProduct(req.user.sub, id, dto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string, @Req() req) {
    return this.productsService.deleteProduct(req.user.sub, id);
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('storeId') storeId?: string,
    @Query('category') category?: string, // ✅ ADDED: category query parameter
  ) {
    return this.productsService.getAllProducts({
      search,
      minPrice,
      maxPrice,
      inStock,
      storeId,
      category, // ✅ ADDED: pass category to service
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  // ✅ ADDED: Get products by specific category
  @Get('category/:category')
  async findByCategory(
    @Param('category') category: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.productsService.getProductsByCategory(category, storeId);
  }

  // ✅ ADDED: Get all available categories
  @Get('meta/categories')
  async getCategories() {
    return this.productsService.getCategories();
  }
}