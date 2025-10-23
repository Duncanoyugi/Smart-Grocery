import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../utils/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async createProduct(ownerId: string, file: Express.Multer.File, dto: CreateProductDto) {
    const store = await this.prisma.store.findUnique({ where: { ownerId } });
    if (!store) throw new ForbiddenException('You must own a store to add products.');

    const upload = await this.cloudinary.uploadImage(file);

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        stock: dto.stock,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        imageUrl: upload.secure_url,
        category: dto.category, // ✅ ADDED: category is now required
        storeId: store.id,
        reorderLevel: dto.reorderLevel, // ✅ ADDED: reorderLevel
      },
    });
  }

  async updateProduct(ownerId: string, productId: string, dto: UpdateProductDto, file?: Express.Multer.File) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.ownerId !== ownerId) throw new ForbiddenException('Not authorized to update this product');

    let imageUrl = product.imageUrl;
    if (file) {
      const upload = await this.cloudinary.uploadImage(file);
      imageUrl = upload.secure_url;
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: { 
        ...dto, 
        imageUrl,
        ...(dto.expiryDate && { expiryDate: new Date(dto.expiryDate) }), // Handle date conversion
      },
    });
  }

  async deleteProduct(ownerId: string, productId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, include: { store: true } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.store.ownerId !== ownerId) throw new ForbiddenException('Not authorized to delete this product');

    await this.prisma.product.delete({ where: { id: productId } });
    return { message: 'Product deleted successfully' };
  }

  async getAllProducts(query: {
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    storeId?: string;
    category?: string; // ✅ ADDED: category filter
  }) {
    const filters: any = {};

    if (query.search) {
      filters.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } }, // ✅ ADDED: search by category
      ];
    }

    if (query.storeId) {
      filters.storeId = query.storeId;
    }

    if (query.category) {
      filters.category = { contains: query.category, mode: 'insensitive' }; // ✅ ADDED: filter by category
    }

    if (query.inStock) {
      filters.stock = { gt: 0 };
    }

    if (query.minPrice || query.maxPrice) {
      filters.price = {};
      if (query.minPrice) filters.price.gte = query.minPrice;
      if (query.maxPrice) filters.price.lte = query.maxPrice;
    }

    return this.prisma.product.findMany({
      where: filters,
      include: { store: { select: { name: true, location: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: { select: { name: true, location: true } },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ✅ ADDED: Get products by category
  async getProductsByCategory(category: string, storeId?: string) {
    const filters: any = { category };

    if (storeId) {
      filters.storeId = storeId;
    }

    return this.prisma.product.findMany({
      where: filters,
      include: { store: { select: { name: true, location: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ✅ ADDED: Get all unique categories
  async getCategories() {
    const categories = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    
    return categories.map(item => item.category).filter(Boolean);
  }
}