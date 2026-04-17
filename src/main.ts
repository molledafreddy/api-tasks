import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(PinoLogger));

  const cfg = app.get(AppConfigService);

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: cfg.get('CORS_ORIGIN') });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Swagger ────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Tasks')
    .setDescription('REST API para gestión de tareas To-Do')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  app.enableShutdownHooks();

  const port = cfg.get('PORT');
  await app.listen(port, '0.0.0.0');

  const logger = app.get(PinoLogger);
  logger.log(`API listening on http://localhost:${port}/api`);
  logger.log(`Swagger docs on http://localhost:${port}/api/docs`);
}

void bootstrap();
