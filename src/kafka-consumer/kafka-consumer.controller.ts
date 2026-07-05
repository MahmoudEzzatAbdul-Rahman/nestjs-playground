import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';

@Controller()
export class KafkaConsumerController {
  private readonly logger = new Logger(KafkaConsumerController.name);

  constructor(
    @InjectQueue('welcome-email')
    private readonly welcomeEmailQueue: bull.Queue,
  ) {}

  @EventPattern('users-events')
  async handleUserEvent(@Payload() message: any) {
    try {
      this.logger.log(`[KAFKA CONSUMER] Raw message received: ${JSON.stringify(message)}`);
      
      // Handle different message structures from Kafka
      let event;
      if (message.value) {
        event = JSON.parse(message.value);
      } else if (typeof message === 'string') {
        event = JSON.parse(message);
      } else {
        event = message;
      }
      
      this.logger.log(`[KAFKA CONSUMER] Received event from topic: users-events`);
      this.logger.log(`[KAFKA CONSUMER] Event type: ${event.eventType}`);
      this.logger.log(`[KAFKA CONSUMER] User ID: ${event.user.id}`);
      this.logger.log(`[KAFKA CONSUMER] User data: ${JSON.stringify(event.user)}`);
      this.logger.log(`[KAFKA CONSUMER] Timestamp: ${event.timestamp}`);
      
      // Add your event processing logic here
      if (event.eventType === 'USER_CREATED') {
        this.logger.log(`[KAFKA CONSUMER] Processing USER_CREATED event for user ${event.user.id}`);
        
        // Schedule welcome email job
        await this.welcomeEmailQueue.add('send-welcome-email', {
          email: event.user.email,
          name: event.user.name,
          userId: event.user.id,
        });
        
        this.logger.log(`[KAFKA CONSUMER] Welcome email job scheduled for user ${event.user.id}`);
      } else if (event.eventType === 'USER_UPDATED') {
        this.logger.log(`[KAFKA CONSUMER] Processing USER_UPDATED event for user ${event.user.id}`);
      }
      
      this.logger.log(`[KAFKA CONSUMER] Event processed successfully`);
    } catch (error) {
      this.logger.error(`[KAFKA CONSUMER] Error processing event: ${error.message}`);
      this.logger.error(`[KAFKA CONSUMER] Message was: ${JSON.stringify(message)}`);
    }
  }
}
