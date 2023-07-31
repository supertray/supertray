import type { Application } from './declarations';

import { disallow } from 'feathers-hooks-common';
import feathersMailer from 'feathers-mailer';

const servicePath = 'mailer';

export function mailer(app: Application) {
  const configuration = app.get('mailer');

  app.use(servicePath, feathersMailer(configuration));

  app.service(servicePath).hooks({
    before: {
      all: disallow('external'),
    },
  });
}

declare module './declarations' {
  interface ServiceTypes {
    [servicePath]: ReturnType<typeof feathersMailer>;
  }
}
