// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type {
  Session,
  SessionData,
  SessionPatch,
  SessionQuery,
  SessionService,
} from './sessions.class';
import type { ClientApplication } from '../../client';
import type { Params } from '@feathersjs/feathers';

export type { Session, SessionData, SessionPatch, SessionQuery };

export const sessionMethods = ['find', 'get', 'create', 'patch', 'remove'] as const;

export type SessionClientService = Pick<
  SessionService<Params<SessionQuery>>,
  (typeof sessionMethods)[number]
>;

export const sessionPath = 'sessions';

export const sessionClient = (client: ClientApplication) => {
  const connection = client.get('connection');

  client.use(sessionPath, connection.service(sessionPath), {
    methods: sessionMethods,
  });
};

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [sessionPath]: SessionClientService;
  }
}
