// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type {
  WorkspaceUsers,
  WorkspaceUsersData,
  WorkspaceUsersPatch,
  WorkspaceUsersQuery,
  WorkspaceUsersService,
} from './workspace-users.class';
import type { ClientApplication } from '../../client';
import type { Params } from '@feathersjs/feathers';

export type { WorkspaceUsers, WorkspaceUsersData, WorkspaceUsersPatch, WorkspaceUsersQuery };

export const workspaceUsersMethods = ['find', 'get', 'create', 'patch', 'remove'] as const;

export type WorkspaceUsersClientService = Pick<
  WorkspaceUsersService<Params<WorkspaceUsersQuery>>,
  (typeof workspaceUsersMethods)[number]
>;

export const workspaceUsersPath = 'workspace-users';

export const workspaceUsersClient = (client: ClientApplication) => {
  const connection = client.get('connection');

  client.use(workspaceUsersPath, connection.service(workspaceUsersPath), {
    methods: workspaceUsersMethods,
  });
};

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [workspaceUsersPath]: WorkspaceUsersClientService;
  }
}
