import type { User } from './users.schema';
import type { Application } from '../../declarations';
import type { SendMailOptions } from 'nodemailer';

import jsonwebtoken from 'jsonwebtoken';
import ms from 'ms';

import { logger } from '../../logger';

function obfuscateEmail(email: string) {
  const [name, domain] = email.split('@');
  let obfuscatedName = `${name.slice(0, 2)}${
    name.length > 4 ? Array.from({ length: name.length - 4 }, () => '*').join('') : ''
  }${name.slice(-2)}`;
  if (name.length < 5)
    obfuscatedName = `${name.slice(0, 1)}${Array.from({ length: name.length - 1 }, () => '*').join(
      '',
    )}`;
  return `${obfuscatedName}@${domain}`;
}

function getExp(to: `${number}m`) {
  const expirationMs = Date.now() + ms(to);
  return Math.floor(expirationMs / 1000);
}

export function notifier(app: Application) {
  function getLink(type: string, hash: string) {
    let { url } = app.get('webClient');
    if (url.charAt(url.length - 1) === '/') {
      url = url.slice(0, -1);
    }
    return `${url}/${type}?token=${hash}`;
  }

  async function sendEmail(email: SendMailOptions) {
    try {
      process.nextTick(async () => {
        const result = await app.service('mailer').create(email);
        logger.info('Sent email', {
          ...result,
          accepted: result.accepted.map((m) => obfuscateEmail(m.toString())),
          rejected: result.rejected.map((m) => obfuscateEmail(m.toString())),
          envelope: {
            ...result.envelope,
            to: result.envelope.to.map((m) => obfuscateEmail(m)),
          },
        });
      });
      return true;
    } catch (err) {
      logger.error(err);
      return false;
    }
  }

  return (type: string, user: User, notifierOptions: { oldEmail?: string } = {}) => {
    const mail = app.get('mailer');
    const { secret } = app.get('authentication');
    if (type === 'resendVerifySignup') {
      const token = jsonwebtoken.sign(
        {
          sub: user.id,
          exp: getExp('15m'),
          act: 'verifySignup',
        },
        secret,
      );
      return sendEmail({
        from: mail.from,
        to: user.email,
        subject: 'Supertray - Please confirm your e-mail address',
        text: `Click here: ${getLink('verify', token)}`,
      });
    }
    if (type === 'verifySignup') {
      return sendEmail({
        from: mail.from,
        to: user.email,
        subject: 'Supertray - E-Mail address verified',
        text: 'Registration process complete. Thanks for joining us!',
      });
    }
    if (type === 'sendResetPwd') {
      const token = jsonwebtoken.sign(
        {
          sub: user.id,
          exp: getExp('15m'),
          act: 'resetPwd',
        },
        secret,
      );
      return sendEmail({
        from: mail.from,
        to: user.email,
        subject: 'Supertray - Reset your password',
        text: `Click here to reset: ${getLink('password-reset', token)}`,
      });
    }
    if (type === 'emailChange' && notifierOptions.oldEmail) {
      return sendEmail({
        from: mail.from,
        to: user.email,
        subject: 'Supertray - E-Mail address changed',
        text: `You have changed your E-Mail address from ${notifierOptions.oldEmail} to ${user.email}`,
      });
    }
    return undefined;
  };
}
