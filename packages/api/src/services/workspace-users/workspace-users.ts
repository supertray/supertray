// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import type { Application } from '../../declarations';

import { authenticate } from '@feathersjs/authentication';
import { hooks as schemaHooks } from '@feathersjs/schema';

import { WorkspaceUsersService, getOptions } from './workspace-users.class';
import {
  workspaceUsersDataValidator,
  workspaceUsersPatchValidator,
  workspaceUsersQueryValidator,
  workspaceUsersResolver,
  workspaceUsersExternalResolver,
  workspaceUsersDataResolver,
  workspaceUsersPatchResolver,
  workspaceUsersQueryResolver,
} from './workspace-users.schema';
import { workspaceUsersPath, workspaceUsersMethods } from './workspace-users.shared';
import { authorizeKnexHook } from '../../hooks/abilities';
import { beforeJoinRelated, hasOne, joinRelated } from '../../hooks/joinRelated';

export * from './workspace-users.class';

// A configure function that registers the service and its hooks via `app.configure`
export const workspaceUsers = (app: Application) => {
  // Register our service on the Feathers application
  app.use(workspaceUsersPath, new WorkspaceUsersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: workspaceUsersMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
  });
  // Initialize hooks
  app.service(workspaceUsersPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(workspaceUsersExternalResolver),
        schemaHooks.resolveResult(workspaceUsersResolver),
      ],
    },
    before: {
      all: [
        schemaHooks.validateQuery(workspaceUsersQueryValidator),
        schemaHooks.resolveQuery(workspaceUsersQueryResolver),
        authorizeKnexHook(),
        beforeJoinRelated(),
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(workspaceUsersDataValidator),
        schemaHooks.resolveData(workspaceUsersDataResolver),
      ],
      patch: [
        schemaHooks.validateData(workspaceUsersPatchValidator),
        schemaHooks.resolveData(workspaceUsersPatchResolver),
      ],
      remove: [],
    },
    after: {
      all: [
        joinRelated({
          user: hasOne({
            service: 'users',
            parentField: 'userId',
          }),
        }),
      ],
    },
    error: {
      all: [],
    },
  });
};

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [workspaceUsersPath]: WorkspaceUsersService;
  }
}
