import { Controller, Get } from '@nestjs/common';
import { SendEmailsService } from './send-emails.service';
import { EmailsysItemService } from './services/emailsys.item.service';
import { EmailsysItemStatus } from './enums/emailsys-item-status.enum';
import { genBase62FromNumber } from 'src/utils/base62.util';

@Controller('send-emails')
export class SendEmailsController {
  constructor(
    private readonly sendEmailsService: SendEmailsService,
    private readonly emailsysItemService: EmailsysItemService,
  ) { }

  /**
   * This endpoint is called by the Cron Job every minute
   * to send the emails from the queue
   *
   * It will get the next emails to send from the database
   * and send them using the SendEmailsService
   *
   * It will also update the status of the emails in the database
   * after sending them
   *
   * It will also update the status of the emails in the database
   */
  @Get('from-queue')
  async sendEmailsFromQueue() {

    const maxEmailsByMinute = +(process.env.EMAILCRON_MAXEMAILSBYMINUTE || 5);
    const maxMinutes = +(process.env.EMAILCRON_MAXMINUTES || 1);
    const maxEmails = maxEmailsByMinute * maxMinutes;

    const emails = await this.emailsysItemService.getEmailsToSend(maxEmails);

    if (emails.length === 0) {
      console.log(`No emails to send, skipping...`);
      return;
    }

    // Calculate delay between emails to respect maxEmailsByMinute rate limit
    const delayBetweenEmails = (60 * 1000) / maxEmailsByMinute;

    for (const email of emails) {
      try {
        await this.emailsysItemService.updateStatus(email.id, EmailsysItemStatus.Processing);

        // Generate a token based on the email ID, 
        // this token is always the same for the same ID 
        // and is reversible so we can use it to verify
        const token = genBase62FromNumber(email.id);

        await this.sendEmailsService.sendEmail({
          to: email.emailTo,
          subject: 'Complete your registration',
          body: `Thank you for signing up. Please verify your token ${token} to continue.`,
        });

        await this.emailsysItemService.updateStatus(email.id, EmailsysItemStatus.Sent);

      } catch (error) {
        await this.emailsysItemService.updateStatus(email.id, EmailsysItemStatus.Error);

        // log error
        console.error(error);

        throw error
      }

      // Sleep after each email to respect rate limit except for the last one
      if (email !== emails[emails.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenEmails));
      }
    }

    return {
      message: 'Email processing completed.',
      total: emails.length,
    };
  }
}
