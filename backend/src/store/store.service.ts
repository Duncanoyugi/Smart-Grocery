import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a store - ADMIN only
  async createStore(userId: string, userRole: string, dto: CreateStoreDto) {
    // Check if user is ADMIN
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN users can create stores');
    }

    // Check if store name already exists
    const existingStore = await this.prisma.store.findUnique({ 
      where: { name: dto.name } 
    });
    if (existingStore) {
      throw new BadRequestException('Store name already exists');
    }

    // Create store
    const store = await this.prisma.store.create({
      data: {
        name: dto.name,
        location: dto.location,
        ownerId: userId, // ADMIN becomes the store owner
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return store;
  }

  // Get all stores (public - any user can view)
  async getAllStores() {
    const stores = await this.prisma.store.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: {
          where: {
            stock: { gt: 0 }, // Only include products with stock > 0
          },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return stores;
  }

  // Get store by ID (public - any user can view)
  async getStoreById(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: {
          where: {
            stock: { gt: 0 }, // Only include available products
          },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            stock: true,
            imageUrl: true,
            expiryDate: true,
            createdAt: true,
          },
        },
      },
    });
    
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    
    return store;
  }

  // Get the store owned by the current user
  async getMyStore(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { ownerId: userId },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            stock: true,
            imageUrl: true,
            expiryDate: true,
            createdAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!store) {
      throw new NotFoundException('Store not found for this user');
    }
    
    return store;
  }

  // Update store - ADMIN only (or store owner)
  async updateStore(userId: string, userRole: string, storeId: string, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({ 
      where: { id: storeId } 
    });
    
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if user is ADMIN or store owner
    if (userRole !== 'ADMIN' && store.ownerId !== userId) {
      throw new ForbiddenException('You are not authorized to update this store');
    }

    // Check if new store name already exists (if name is being updated)
    if (dto.name && dto.name !== store.name) {
      const existingStore = await this.prisma.store.findUnique({
        where: { name: dto.name },
      });
      if (existingStore) {
        throw new BadRequestException('Store name already exists');
      }
    }

    const updatedStore = await this.prisma.store.update({
      where: { id: storeId },
      data: { ...dto },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return updatedStore;
  }

  // Delete store - ADMIN only
  async deleteStore(userId: string, userRole: string, storeId: string) {
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN users can delete stores');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Delete store (Prisma will handle related products due to relations)
    await this.prisma.store.delete({
      where: { id: storeId },
    });

    return { message: 'Store deleted successfully' };
  }
}