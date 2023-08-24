// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { Application } from '../../declarations';

import { authenticate } from '@feathersjs/authentication';
import { transaction } from '@feathersjs/knex';
import { hooks as schemaHooks } from '@feathersjs/schema';
import { disallow, iff } from 'feathers-hooks-common';

import { WorkspacesService, getOptions } from './workspaces.class';
import {
  workspacesDataValidator,
  workspacesPatchValidator,
  workspacesQueryValidator,
  workspacesResolver,
  workspacesExternalResolver,
  workspacesDataResolver,
  workspacesPatchResolver,
  workspacesQueryResolver,
} from './workspaces.schema';
import { workspacesPath, workspacesMethods } from './workspaces.shared';
import { authorizeKnexHook } from '../../hooks/abilities';

export * from './workspaces.class';

// A configure function that registers the service and its hooks via `app.configure`
export const workspaces = (app: Application) => {
  // Register our service on the Feathers application
  app.use(workspacesPath, new WorkspacesService(getOptions(app), app), {
    // A list of all methods this service exposes externally
    methods: workspacesMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  });
  // Initialize hooks
  app.service(workspacesPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(workspacesExternalResolver),
        schemaHooks.resolveResult(workspacesResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(workspacesQueryValidator),
        schemaHooks.resolveQuery(workspacesQueryResolver),
        iff((ctx) => ctx.method !== 'create', authorizeKnexHook()),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(workspacesDataValidator),
        schemaHooks.resolveData(workspacesDataResolver),
        transaction.start(),
      ],
      patch: [
        schemaHooks.validateData(workspacesPatchValidator),
        schemaHooks.resolveData(workspacesPatchResolver),
      ],
      remove: [disallow('external')],
    },
    after: {
      all: [iff((ctx) => ctx.method !== 'create', authorizeKnexHook())],
      create: [transaction.end()],
    },
    error: {
      all: [],
      create: [transaction.rollback()],
    },
  });
};

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [workspacesPath]: WorkspacesService;
  }
}
