import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import bull from 'bull';

@Processor('welcome-email')
export class WelcomeEmailProcessor {
  private readonly logger = new Logger(WelcomeEmailProcessor.name);

  @Process('send-welcome-email')
  async handleSendWelcomeEmail(job: bull.Job) {
    try {
      const { email, name, userId } = job.data;
      this.logger.log(`Processing welcome email for user ${userId}`);
      this.logger.log(`Email: ${email}, Name: ${name}`);
      
      // TODO: Implement actual email sending logic here
      // Example: await this.emailService.sendWelcomeEmail(email, name);
      
      this.logger.log(`Welcome email sent successfully to ${email}`);
      
      return { success: true, message: 'Welcome email sent' };
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
      throw error;
    }
  }
}
