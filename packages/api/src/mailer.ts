import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import nodemailer from 'nodemailer';

import { env } from './env';
import { logger } from './logger';

const anonymizeEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (local.length <= 4) {
    return `${local.slice(0, 1)}***@${domain}`;
  }
  const anonymizedLocal = `${local.slice(0, 2)}***${local.slice(-2)}`;
  return `${anonymizedLocal}@${domain}`;
};

type NewMail = { to: string; subject: string; html: string; closeAfter?: boolean };

let transporter: Transporter<SMTPTransport.SentMessageInfo> | undefined;

const send = async ({ to, subject, html, closeAfter = true }: NewMail) => {
  transporter =
    transporter ||
    nodemailer.createTransport({
      host: env.EMAIL_SMTP_HOST,
      port: Number(env.EMAIL_SMTP_PORT),
      secure: false,
      auth: {
        user: env.EMAIL_SMTP_USER,
        pass: env.EMAIL_SMTP_PASSWORD,
      },
    });
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    logger.info({
      message: `Sent mail to ${anonymizeEmail(to)}.`,
      info: {
        messageId: info.messageId,
        accepted: info.accepted.map((email) => anonymizeEmail(email.toString())),
        rejected: info.rejected.map((email) => anonymizeEmail(email.toString())),
      },
    });
  } catch (error) {
    logger.error({
      message: `Failed to send mail to ${anonymizeEmail(to)}.`,
      error,
    });
  }
  if (closeAfter) {
    transporter.close();
  }
};

const sendInBackground = (mail: NewMail) =>
  process.nextTick(async () => {
    try {
      await send(mail);
    } catch (e) {
      logger.error({
        message: 'Failed to send mail in background.',
        error: e,
      });
    }
  });

const sendMultipleInBackground = (mails: Omit<NewMail, 'closeAfter'>[]) => {
  mails.forEach((mail, index) => {
    sendInBackground({
      ...mail,
      closeAfter: false,
    });
    if (index === mails.length - 1) {
      transporter?.close();
    }
  });
};

export const mailer = {
  send,
  sendInBackground,
  sendMultipleInBackground,
};
