// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type {
  Workspaces,
  WorkspacesData,
  WorkspacesPatch,
  WorkspacesQuery,
  WorkspacesService,
} from './workspaces.class';
import type { ClientApplication } from '../../client';
import type { Params } from '@feathersjs/feathers';

export type { Workspaces, WorkspacesData, WorkspacesPatch, WorkspacesQuery };

export const workspacesMethods = ['find', 'get', 'create', 'patch', 'remove'] as const;

export type WorkspacesClientService = Pick<
  WorkspacesService<Params<WorkspacesQuery>>,
  (typeof workspacesMethods)[number]
>;

export const workspacesPath = 'workspaces';

export const workspacesClient = (client: ClientApplication) => {
  const connection = client.get('connection');

  client.use(workspacesPath, connection.service(workspacesPath), {
    methods: workspacesMethods,
  });
};

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [workspacesPath]: WorkspacesClientService;
  }
}
