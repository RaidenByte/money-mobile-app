import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/filters/http-error.filter';

async function bootstrap() {
  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  const cors = corsOrigin
    ? {
        origin: corsOrigin.split(',').map((item) => item.trim()).filter(Boolean),
      }
    : true;

  const app = await NestFactory.create(AppModule, { cors });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpErrorFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Money Mobile API')
    .setDescription('个人记账应用后端接口文档')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  const publicBaseUrl = process.env.PUBLIC_BASE_URL?.trim() || `http://localhost:${port}`;
  console.log(`API running on ${publicBaseUrl}`);
  console.log(`Swagger docs: ${publicBaseUrl}/docs`);
}

void bootstrap();
