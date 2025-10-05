import { Role } from '@common/index.js';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import AppModule from './app.module.js';
import { LoggingInterceptor } from './middleware/logging.interceptor.js';

async function bootstrap() {
  const console = new Logger('main.ts');

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['fatal', 'error', 'warn', 'log']
        : ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  console.debug(`>> Used Config: ${JSON.stringify(config['internalConfig'])}`);
  console.debug(`>> Import from common: ${Role.ADMIN}`);

  app.enableShutdownHooks();
  app.enableCors();

  await app.register(helmet, {});
  await app.register(compression, { encodings: ['gzip', 'deflate'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.npm_package_name || 'API')
    .setDescription(process.env.npm_package_description || 'API description')
    .setVersion(process.env.npm_package_version || 'Unknown')
    .addBearerAuth()
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDoc);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(config.get('app.options.port'), config.get('app.options.host'));
}
bootstrap();
