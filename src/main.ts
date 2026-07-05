import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Connect Kafka consumer microservice
  const kafkaBrokers = configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'nestjs-users-consumer',
        brokers: kafkaBrokers,
      },
      consumer: {
        groupId: 'users-consumer-group',
      },
    },
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS Modular Monolith API')
    .setDescription('API documentation for NestJS Modular Monolith with Kafka, Redis, and PostgreSQL')
    .setVersion('1.0')
    .addTag('users')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start both HTTP server and microservices
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
