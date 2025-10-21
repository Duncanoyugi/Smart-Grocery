import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { CloudinaryService } from '../utils/cloudinary.service';

@Module({
  imports: [MulterModule.register()],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, CloudinaryService],
  exports: [UsersService],
})
export class UsersModule {}
