import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class MailerService {
  constructor(private readonly nestMailerService: NestMailerService) {}

  /**
   * Sends OTP email upon registration
   */
  async sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
    const templatePath = path.join(__dirname, 'templates', 'otp-email.ejs');
    const html = await this.renderTemplate(templatePath, { name, otp });

    await this.nestMailerService.sendMail({
      to,
      subject: 'Your Smart Grocery OTP Code',
      html,
    });
  }

  /**
   * Sends welcome email after successful first login
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const templatePath = path.join(__dirname, 'templates', 'welcome-email.ejs');
    const html = await this.renderTemplate(templatePath, { name });

    await this.nestMailerService.sendMail({
      to,
      subject: 'Welcome to Smart Grocery 🎉',
      html,
    });
  }

  /**
   * Utility to render EJS templates
   */
  private async renderTemplate(templatePath: string, data: Record<string, any>): Promise<string> {
    try {
      if (!fs.existsSync(templatePath)) {
        const fallbackPath = path.join(process.cwd(), 'src', 'mailer', 'templates', path.basename(templatePath));
        templatePath = fallbackPath;
      }

      const template = fs.readFileSync(templatePath, 'utf-8');
      return ejs.render(template, data);
    } catch (err) {
      console.error('Template rendering error:', err);
      throw new InternalServerErrorException('Error rendering email template');
    }
  }
}