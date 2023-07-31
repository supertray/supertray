import type { Application } from '../declarations';

import { session } from './sessions/sessions';
import { user } from './users/users';
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions

export const services = (app: Application) => {
  app.configure(user);
  app.configure(session);
  // All services will be registered here
};
