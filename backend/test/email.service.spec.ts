import type { ConfigService } from '@nestjs/config';
import type { Transporter } from 'nodemailer';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../src/common/prisma/prisma.service';
import { EmailService, renderEmail } from '../src/modules/email/email.service';

const config = { get: () => undefined } as unknown as ConfigService;

function setup(sendMail: () => Promise<unknown>) {
  const create = vi.fn().mockResolvedValue({});
  const prisma = { emailLog: { create } } as unknown as PrismaService;
  const transport = { sendMail: vi.fn(sendMail) } as unknown as Transporter;
  return { service: new EmailService(config, prisma, transport), create, transport };
}

const input = {
  to: 'a@example.com',
  subject: 'S',
  heading: 'H',
  body: 'B',
  type: 'Test',
  userId: 1,
  organizationId: 2,
};

describe('EmailService', () => {
  it('sends and logs a successful email', async () => {
    const { service, create, transport } = setup(async () => ({}));
    expect(await service.send(input)).toBe(true);
    expect(transport.sendMail).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0].data).toMatchObject({ status: 'Sent', toEmail: 'a@example.com', organizationId: 2 });
  });

  it('never throws when SMTP fails, and logs the failure', async () => {
    const { service, create } = setup(async () => {
      throw new Error('connection refused');
    });
    expect(await service.send(input)).toBe(false);
    expect(create.mock.calls[0][0].data).toMatchObject({ status: 'Failed', error: 'connection refused' });
  });

  it('never throws when the log write fails too', async () => {
    const { service, create } = setup(async () => ({}));
    create.mockRejectedValueOnce(new Error('db down'));
    await expect(service.send(input)).resolves.toBe(true);
  });
});

describe('renderEmail', () => {
  it('escapes HTML and includes the link', () => {
    const { html, text } = renderEmail({
      heading: '<b>Hi</b>',
      body: 'x & y',
      link: { url: 'https://app/x?a=1&b=2', label: 'Open' },
    });
    expect(html).not.toContain('<b>Hi</b>');
    expect(html).toContain('&lt;b&gt;Hi&lt;/b&gt;');
    expect(text).toContain('https://app/x?a=1&b=2');
  });
});
