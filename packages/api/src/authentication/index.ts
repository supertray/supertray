// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import type { Application } from '../declarations';

import { JWTStrategy } from '@feathersjs/authentication';
import { LocalStrategy } from '@feathersjs/authentication-local';

import { CustomAuthenticationService } from './custom';

declare module '../declarations' {
  interface ServiceTypes {
    authentication: CustomAuthenticationService;
  }
}

export const authentication = (app: Application) => {
  const authService = new CustomAuthenticationService(app);

  authService.register('jwt', new JWTStrategy());
  authService.register('local', new LocalStrategy());

  app.use('authentication', authService);
};
