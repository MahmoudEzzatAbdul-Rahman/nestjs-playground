import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaConsumerController } from './kafka-consumer.controller';
import { BullMQModule } from '../bullmq/bullmq.module';

@Module({
  imports: [
    BullMQModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'nestjs-users-consumer',
              brokers: configService.get('KAFKA_BROKERS', 'localhost:9092').split(','),
            },
            consumer: {
              groupId: 'users-consumer-group',
            },
          },
        }),
      },
    ]),
  ],
  controllers: [KafkaConsumerController],
})
export class KafkaConsumerModule {}
