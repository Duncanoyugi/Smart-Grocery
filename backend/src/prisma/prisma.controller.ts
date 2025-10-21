import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('db')
export class PrismaController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('test')
  async testConnection() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { message: '✅ Database connection successful' };
    } catch (error) {
      console.error(error);
      return { message: '❌ Database connection failed', error: error.message };
    }
  }
}
