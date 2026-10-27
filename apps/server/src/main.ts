import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { UPLOAD_ROOT } from './common/constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  Logger.overrideLogger(['log', 'warn', 'error']);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('app');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.use(
    bodyParser.json({
      limit: '100mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
  // Uploaded documents & signatures are served from /uploads/<file>
  app.useStaticAssets(UPLOAD_ROOT, { prefix: '/uploads/' });
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    allowedHeaders: '*',
    methods: 'GET,PUT,POST,PATCH,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(Number(process.env.PORT) || 4000);
}

bootstrap().catch((err) => {
  Logger.error(
    'Failed to start application',
    err instanceof Error ? err.stack : String(err),
    'Bootstrap',
  );
  process.exit(1);
});
