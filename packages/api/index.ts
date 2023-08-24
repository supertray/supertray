import { createLocalAuthStrategy, createServer, listen } from './src/index';

const server = createServer({
  authStrategies: [createLocalAuthStrategy()],
});

listen();
