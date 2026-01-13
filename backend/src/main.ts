import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { setupSwagger } from './common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000', 'http://localhost:8081', 'http://localhost:19000', 'http://localhost:19006'];
  
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // Enable validation pipes globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filters (order matters - most specific first)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaExceptionFilter(),
    new AllExceptionsFilter(),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Setup Swagger documentation
  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
