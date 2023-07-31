// For more information about this file see https://dove.feathersjs.com/guides/cli/client.html
import type { AuthenticationClientOptions } from '@feathersjs/authentication-client';
import type { TransportConnection, Application } from '@feathersjs/feathers';

import authenticationClient from '@feathersjs/authentication-client';
import { feathers } from '@feathersjs/feathers';

import { sessionClient } from './services/sessions/sessions.shared';
import { userClient } from './services/users/users.shared';

export type {
  Session,
  SessionData,
  SessionQuery,
  SessionPatch,
} from './services/sessions/sessions.shared';

export type { User, UserData, UserQuery, UserPatch } from './services/users/users.shared';

export interface ServiceTypes {}

export interface Configuration {
  connection: TransportConnection<ServiceTypes>;
}

export type ClientApplication = Application<ServiceTypes, Configuration>;

/**
 * Returns a typed client for the api app.
 *
 * @param connection The REST or Socket.io Feathers client connection
 * @param authenticationOptions Additional settings for the authentication client
 * @see https://dove.feathersjs.com/api/client.html
 * @returns The Feathers client application
 */
export const createClient = <TConfiguration = any>(
  connection: TransportConnection<ServiceTypes>,
  authenticationOptions: Partial<AuthenticationClientOptions> = {},
) => {
  const client: ClientApplication = feathers();

  client.configure(connection);
  client.configure(authenticationClient(authenticationOptions));
  client.set('connection', connection);

  client.configure(userClient);
  client.configure(sessionClient);
  return client;
};
