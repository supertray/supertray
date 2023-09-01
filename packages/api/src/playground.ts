import { createServer } from 'http';

import { nodeHandler } from 'trpc-playground/handlers/node';

import { ctx } from './context';
import { trpcRouter } from './trpc-router';

const trpcPlaygroundEndpoint = '/playground';
const trpcApiEndpoint = `http://localhost:${ctx.env.PORT}/trpc`;

(async () => {
  const playgroundHandler = await nodeHandler({
    playgroundEndpoint: trpcPlaygroundEndpoint,
    router: trpcRouter,
    trpcApiEndpoint,
  });

  createServer((req, res) => {
    if (req.url?.startsWith(trpcPlaygroundEndpoint)) {
      playgroundHandler(req, res).catch(() => {});
    }
  }).listen(ctx.env.PLAYGROUND_PORT, ctx.env.HOST, () => {
    ctx.logger.info(
      `TRPC playground listening on http://${ctx.env.HOST}:${ctx.env.PLAYGROUND_PORT}/playground`,
    );
  });
})().catch(() => {});
