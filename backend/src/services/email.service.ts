import { createTransport, type Transporter } from 'nodemailer';
import type { AppConfig } from '../config';
import { renderEmail, type EmailContent } from '../helpers';
import type { EmailLogRepositoryContract } from '../types';
import { createLogger } from '../utils';

const logger = createLogger('Email');

/** One email to send plus the bookkeeping stored in the email log. */
export interface SendEmailInput extends EmailContent {
  to: string;
  subject: string;
  type: string;
  userId?: number;
  companyId?: number | null;
}

/** What other services need from the email service (lets tests substitute a fake). */
export interface EmailSender {
  send(input: SendEmailInput): Promise<boolean>;
}

/** Sends notification emails over SMTP (Mailpit in development) and logs every attempt. */
export class EmailService implements EmailSender {
  private readonly transport: Transporter;

  constructor(
    private readonly config: Pick<AppConfig, 'smtp' | 'mailFrom'>,
    private readonly emailLogs: EmailLogRepositoryContract,
    transport?: Transporter,
  ) {
    this.transport =
      transport ??
      createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass ?? '' } : undefined,
      });
  }

  /** Sends one email and logs the attempt. Never throws: email failures must not break the flow. Returns whether it was sent. */
  async send(input: SendEmailInput): Promise<boolean> {
    const { text, html } = renderEmail(input);
    let status: 'Sent' | 'Failed' = 'Sent';
    let error: string | null = null;
    try {
      await this.transport.sendMail({ from: this.config.mailFrom, to: input.to, subject: input.subject, text, html });
    } catch (e) {
      status = 'Failed';
      error = e instanceof Error ? e.message.slice(0, 500) : 'Unknown error';
      logger.warn(`Email "${input.type}" to user ${input.userId ?? '-'} failed: ${error}`);
    }
    try {
      await this.emailLogs.create({
        companyId: input.companyId ?? null,
        userId: input.userId ?? null,
        toEmail: input.to,
        type: input.type,
        subject: input.subject,
        status,
        error,
      });
    } catch (e) {
      logger.error('Could not write email log', e);
    }
    return status === 'Sent';
  }
}
