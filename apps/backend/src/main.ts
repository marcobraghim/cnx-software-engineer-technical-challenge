import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isDevelopment = process.env.NODE_ENV !== 'production';
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : true;

  app.enableCors({
    origin: isDevelopment ? true : allowedOrigins,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }))
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
