// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations';

import { authenticate } from '@feathersjs/authentication';
import { hooks as schemaHooks } from '@feathersjs/schema';
import { disallow } from 'feathers-hooks-common';

import { SessionService, getOptions } from './sessions.class';
import {
  sessionDataValidator,
  sessionPatchValidator,
  sessionQueryValidator,
  sessionResolver,
  sessionDataResolver,
  sessionPatchResolver,
  sessionQueryResolver,
  sessionRefreshValidator,
  sessionRefreshResolver,
  sessionLogoutValidator,
  sessionLogoutResolver,
  sessionExternalResolver,
} from './sessions.schema';
import { sessionPath, sessionMethods } from './sessions.shared';

export * from './sessions.class';
// export * from './sessions.schema';

// A configure function that registers the service and its hooks via `app.configure`
export const session = (app: Application) => {
  // Register our service on the Feathers application
  app.use(sessionPath, new SessionService(getOptions(app), app), {
    // A list of all methods this service exposes externally
    methods: [...sessionMethods, 'refresh', 'logout'],
    // You can add additional custom events to be sent to clients here
    events: [],
  });
  // Initialize hooks
  app.service(sessionPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(sessionExternalResolver),
        schemaHooks.resolveResult(sessionResolver),
      ],
      logout: [authenticate('jwt')],
    },
    before: {
      all: [
        schemaHooks.validateQuery(sessionQueryValidator),
        schemaHooks.resolveQuery(sessionQueryResolver),
      ],
      find: [disallow('external')],
      get: [disallow('external')],
      create: [
        disallow('external'),
        schemaHooks.validateData(sessionDataValidator),
        schemaHooks.resolveData(sessionDataResolver),
      ],
      patch: [
        disallow('external'),
        schemaHooks.validateData(sessionPatchValidator),
        schemaHooks.resolveData(sessionPatchResolver),
      ],
      remove: [disallow('external')],
      refresh: [
        schemaHooks.validateData(sessionRefreshValidator),
        schemaHooks.resolveData(sessionRefreshResolver),
      ],
      logout: [
        schemaHooks.validateData(sessionLogoutValidator),
        schemaHooks.resolveData(sessionLogoutResolver),
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
    [sessionPath]: SessionService;
  }
}
