/* eslint-disable @typescript-eslint/no-floating-promises */
import { createServer } from 'http';

import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import cors from 'cors';

import { ctx } from './context';
// import { uploadRoute } from './routes/upload';
import { uploadRouter } from './routes/upload';
import { trpcRouter } from './trpc-router';

const trpcHandler = createHTTPHandler({
  router: trpcRouter,
  middleware: cors({
    origin: '*',
  }),
  createContext: ({ req }) => {
    return {
      ...ctx,
      req,
    };
  },
});

const server = createServer((req, res) => {
  if (req.url?.startsWith('/trpc')) {
    req.url = req.url.replace(/^\/trpc/, '');
    trpcHandler(req, res);
    return;
  }
  if (req.url?.startsWith('/api/upload')) {
    uploadRouter(req, res);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

// router.newGroup('/api/upload').use(uploadRouter);

server.listen(ctx.env.PORT, ctx.env.HOST);

ctx.logger.info(`TRPC Server started on http://localhost:${ctx.env.PORT}/trpc`);
