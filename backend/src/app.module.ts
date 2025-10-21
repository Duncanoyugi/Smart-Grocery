import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from './mailer/mailer.module'; // ✅ keep your local one only
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './user/user.module';

@Module({
  imports: [
    AuthModule,
    MailerModule, 
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
