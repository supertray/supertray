// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { Application, HookContext } from '../../declarations';

import { authenticate } from '@feathersjs/authentication';
import { hooks as schemaHooks } from '@feathersjs/schema';
import { disallow, discard, iff, isProvider } from 'feathers-hooks-common';

import { UserService, getOptions } from './users.class';
import {
  userDataValidator,
  userPatchValidator,
  userQueryValidator,
  userResolver,
  userExternalResolver,
  userDataResolver,
  userPatchResolver,
  userQueryResolver,
  userActionResolver,
  userActionValidator,
  userPatchExternalDiscardedFields,
} from './users.schema';
import { userPath, userMethods } from './users.shared';

export * from './users.class';
// export * from './users.schema';

// A configure function that registers the service and its hooks via `app.configure`
export const user = (app: Application) => {
  // Register our service on the Feathers application
  app.use(userPath, new UserService(getOptions(app), app), {
    // A list of all methods this service exposes externally
    methods: [...userMethods, 'action'],
    // You can add additional custom events to be sent to clients here
    events: [],
  });
  // Initialize hooks
  app.service(userPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(userExternalResolver),
        schemaHooks.resolveResult(userResolver),
      ],
      find: [authenticate('jwt')],
      get: [authenticate('jwt')],
      create: [],
      update: [authenticate('jwt')],
      patch: [authenticate('jwt')],
      remove: [authenticate('jwt')],
      action: [
        async (ctx: HookContext, next) => {
          if (['emailChange', 'pwdChange'].includes(ctx.data.action)) {
            return authenticate('jwt')(ctx, next);
          }
          return ctx;
        },
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(userQueryValidator),
        schemaHooks.resolveQuery(userQueryResolver),
      ],
      find: [],
      get: [],
      create: [
        iff((ctx) => !ctx.app.get('users').externalSignup, disallow('external')),
        schemaHooks.validateData(userDataValidator),
        schemaHooks.resolveData(userDataResolver),
      ],
      patch: [
        schemaHooks.validateData(userPatchValidator),
        iff(isProvider('external'), discard(...userPatchExternalDiscardedFields)),
        schemaHooks.resolveData(userPatchResolver),
      ],
      remove: [],
      action: [
        schemaHooks.validateData(userActionValidator),
        schemaHooks.resolveData(userActionResolver),
      ],
    },
    after: {
      all: [],
    },
    error: {
      all: [],
    },
  });
};

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [userPath]: UserService;
  }
}
