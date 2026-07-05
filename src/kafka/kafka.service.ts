import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private readonly topic = 'users-events';
  private readonly logger = new Logger(KafkaService.name);

  constructor(private configService: ConfigService) {
    const brokers = this.configService.get('KAFKA_BROKERS', 'localhost:9092').split(',');
    this.kafka = new Kafka({
      clientId: 'nestjs-users-service',
      brokers,
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log('Kafka producer connected successfully');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka producer disconnected');
  }

  async publishUserCreated(user: any) {
    const eventData = {
      eventType: 'USER_CREATED',
      user,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`[KAFKA PRODUCER] Publishing USER_CREATED event for user ${user.id}`);
    this.logger.log(`[KAFKA PRODUCER] Topic: ${this.topic}`);
    this.logger.log(`[KAFKA PRODUCER] Event data: ${JSON.stringify(eventData)}`);

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: user.id,
          value: JSON.stringify(eventData),
        },
      ],
    });

    this.logger.log(`[KAFKA PRODUCER] USER_CREATED event published successfully for user ${user.id}`);
  }

  async publishUserUpdated(user: any) {
    const eventData = {
      eventType: 'USER_UPDATED',
      user,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`[KAFKA PRODUCER] Publishing USER_UPDATED event for user ${user.id}`);
    this.logger.log(`[KAFKA PRODUCER] Topic: ${this.topic}`);
    this.logger.log(`[KAFKA PRODUCER] Event data: ${JSON.stringify(eventData)}`);

    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: user.id,
          value: JSON.stringify(eventData),
        },
      ],
    });

    this.logger.log(`[KAFKA PRODUCER] USER_UPDATED event published successfully for user ${user.id}`);
  }
}
