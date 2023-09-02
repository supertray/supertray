import type { ContextWebSocket } from './trpc';
import type { AnyRouter } from '@trpc/server';
import type { WSSHandlerOptions } from '@trpc/server/adapters/ws';
import type { IncomingMessage, Server, ServerResponse } from 'http';

import { applyWSSHandler } from '@trpc/server/adapters/ws';
import ws from 'ws';

import { env } from './env';
import { logger } from './logger';

export const createWebsocketServer = <TRouter extends AnyRouter>(options: {
  server: Server<typeof IncomingMessage, typeof ServerResponse>;
  trpcRouter: WSSHandlerOptions<TRouter>['router'];
  createContext: WSSHandlerOptions<TRouter>['createContext'];
}) => {
  const { server, createContext } = options;

  const wss = new ws.Server({
    // server: options.server,
    noServer: true,
  });

  const handler = applyWSSHandler({
    wss,
    router: options.trpcRouter,
    createContext: (opts) => {
      return createContext?.(opts);
    },
  });

  wss.on('connection', (socket: ContextWebSocket) => {
    socket.once('close', () => {
      // eslint-disable-next-line no-param-reassign
      socket.accessToken = undefined;
    });
  });

  logger.info(`TRPC WebSocket Server started on ws://localhost:${env.PORT}/ws`);

  process.on('SIGTERM', () => {
    handler.broadcastReconnectNotification();
    wss.close();
  });

  server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (conn) => {
        wss.emit('connection', conn, request);
      });
      return;
    }
    socket.destroy();
  });

  return wss;
};
