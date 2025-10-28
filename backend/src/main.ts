import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for your Angular frontend
  app.enableCors({
    origin: 'http://localhost:4200', // Your Angular development server
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  
  // Add global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Set global prefix if you want all routes to start with /api
  app.setGlobalPrefix('api');
  
  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Backend running on: http://localhost:3000');
  console.log('✅ CORS enabled for: http://localhost:4200');
}
bootstrap();