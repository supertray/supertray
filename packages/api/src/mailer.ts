import type { Application } from './declarations';
import type { SendMailOptions } from 'nodemailer';

import { disallow } from 'feathers-hooks-common';
import feathersMailer from 'feathers-mailer';

import { logger } from './logger';

const servicePath = 'mailer';

export function mailer(app: Application) {
  const configuration = app.get('mailer');
  const service = feathersMailer(configuration);

  app.use(servicePath, service);

  app.service(servicePath).hooks({
    before: {
      all: disallow('external'),
    },
  });
}

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

export async function sendEmail(app: Application, email: SendMailOptions) {
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

declare module './declarations' {
  interface ServiceTypes {
    [servicePath]: ReturnType<typeof feathersMailer>;
  }
}
