import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { PrismaService } from '../../common/prisma/prisma.service';

export const MAIL_TRANSPORT = 'MAIL_TRANSPORT';

export interface SendEmailInput {
  to: string;
  subject: string;
  /** Short message. Never put minutes text in here. */
  heading: string;
  body: string;
  /** Optional link into the app; emails never carry decisions. */
  link?: { url: string; label: string };
  type: string;
  userId?: number;
  organizationId?: number | null;
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Renders the single minimal email layout. */
export function renderEmail(input: Pick<SendEmailInput, 'heading' | 'body' | 'link'>): {
  text: string;
  html: string;
} {
  const text = [input.heading, '', input.body, input.link ? `\n${input.link.label}: ${input.link.url}` : '']
    .join('\n')
    .trim();
  const button = input.link
    ? `<p><a href="${escapeHtml(input.link.url)}" style="display:inline-block;padding:10px 18px;background:#1f3a34;color:#fff;border-radius:6px;text-decoration:none">${escapeHtml(input.link.label)}</a></p>`
    : '';
  const html = `<div style="font-family:system-ui,Segoe UI,sans-serif;max-width:520px;margin:auto;color:#1c1c1a"><h2 style="margin:0 0 12px">${escapeHtml(input.heading)}</h2><p style="line-height:1.5">${escapeHtml(input.body)}</p>${button}</div>`;
  return { text, html };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transport: Transporter;
  private readonly from: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    // Only tests provide this; in the app it is absent and SMTP settings are used.
    @Optional() @Inject(MAIL_TRANSPORT) transport?: Transporter,
  ) {
    this.from = config.get<string>('MAIL_FROM') ?? 'Department App <no-reply@localhost>';
    const user = config.get<string>('SMTP_USER');
    this.transport =
      transport ??
      createTransport({
        host: config.get<string>('SMTP_HOST') ?? 'localhost',
        port: Number(config.get<string>('SMTP_PORT') ?? 1025),
        secure: config.get<string>('SMTP_SECURE') === 'true',
        auth: user ? { user, pass: config.get<string>('SMTP_PASS') ?? '' } : undefined,
      });
  }

  /** Sends one email and logs the attempt. Never throws: failures must not break the flow. */
  async send(input: SendEmailInput): Promise<boolean> {
    const { text, html } = renderEmail(input);
    let status = 'Sent';
    let error: string | null = null;
    try {
      await this.transport.sendMail({ from: this.from, to: input.to, subject: input.subject, text, html });
    } catch (e) {
      status = 'Failed';
      error = e instanceof Error ? e.message.slice(0, 500) : 'Unknown error';
      this.logger.warn(`Email "${input.type}" to user ${input.userId ?? '-'} failed: ${error}`);
    }
    try {
      await this.prisma.emailLog.create({
        data: {
          organizationId: input.organizationId ?? null,
          userId: input.userId ?? null,
          toEmail: input.to,
          type: input.type,
          subject: input.subject,
          status,
          error,
        },
      });
    } catch (e) {
      this.logger.error(`Could not write EmailLog: ${e instanceof Error ? e.message : String(e)}`);
    }
    return status === 'Sent';
  }
}
