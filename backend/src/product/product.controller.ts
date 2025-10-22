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
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async create(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateProductDto, @Req() req) {
    return this.productsService.createProduct(req.user.sub, file, dto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateProductDto,
    @Req() req,
  ) {
    return this.productsService.updateProduct(req.user.sub, id, dto, file);
  }

  @Delete(':id')
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
  ) {
    return this.productsService.getAllProducts({
        search,
        minPrice,
        maxPrice,
        inStock,
        storeId,
    });
 }

 @Get(':id')
 async findOne(@Param('id') id: string) {
    return this.productsService.getProductById(id);
}
}
