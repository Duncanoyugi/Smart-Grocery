import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from './mailer/mailer.module'; // ✅ keep your local one only
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './user/user.module';
import { StoresModule } from './store/store.module';
import { CartModule } from './cart/cart.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    AuthModule,
    MailerModule, 
    UsersModule,
    StoresModule,
    CartModule,
    InventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
