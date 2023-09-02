/* eslint-disable @typescript-eslint/no-floating-promises */
import { createServer } from 'http';

import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import cors from 'cors';

import { createContext, ctx } from './context';
import { uploadRouter } from './routes/upload';
import { trpcRouter } from './trpc-router';
import { createWebsocketServer } from './websocket';

const trpcHandler = createHTTPHandler({
  router: trpcRouter,
  middleware: cors({
    origin: '*',
  }),
  createContext,
});

const server = createServer((req, res) => {
  if (req.url?.startsWith('/trpc')) {
    req.url = req.url.replace(/^\/trpc/, '');
    trpcHandler(req, res);
    return;
  }
  if (req.url?.startsWith('/api/upload')) {
    uploadRouter(req, res, (storagePath) => {
      console.log(storagePath);
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

createWebsocketServer({
  server,
  trpcRouter,
  createContext,
});

server.listen(ctx.env.PORT);

ctx.logger.info(`TRPC Server started on http://localhost:${ctx.env.PORT}/trpc`);
