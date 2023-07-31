// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { User, UserData, UserPatch, UserQuery, UserService } from './users.class';
import type { ClientApplication } from '../../client';
import type { Params } from '@feathersjs/feathers';

export type { User, UserData, UserPatch, UserQuery };

export const userPath = 'users';

export const userMethods = ['find', 'get', 'create', 'patch', 'remove'] as const;

export type UserClientService = Pick<UserService<Params<UserQuery>>, (typeof userMethods)[number]>;

export const userClient = (client: ClientApplication) => {
  const connection = client.get('connection');

  client.use(userPath, connection.service(userPath), {
    methods: userMethods,
  });
};

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [userPath]: UserClientService;
  }
}
