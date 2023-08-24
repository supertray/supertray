// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import type { Application } from './declarations';

import path from 'path';

import configuration from '@feathersjs/configuration';
import { feathers } from '@feathersjs/feathers';
import {
  koa,
  rest,
  bodyParser,
  errorHandler,
  parseAuthentication,
  cors,
  serveStatic,
} from '@feathersjs/koa';
import socketio from '@feathersjs/socketio';
import { feathersCasl } from 'feathers-casl';

import { channels } from './channels';
import { configurationValidator } from './configuration';
import { logError } from './hooks/log-error';
import { mailer } from './mailer';
import { postgresql } from './postgresql';
import { authentication } from './services/authentication';
import { services } from './services/index';

const app: Application = koa(feathers());

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator));

// Set up Koa middleware
app.use(
  cors({
    origin: app.get('origins') || '*',
  }),
);
app.use(serveStatic(path.resolve(process.cwd(), app.get('public'))));
app.use(errorHandler());
app.use(parseAuthentication());
app.use(bodyParser());

// Configure services and transports
app.configure(rest());
app.configure(
  socketio({
    cors: {
      origin: app.get('origins') || '*',
    },
  }),
);
app.configure(postgresql);
app.configure(authentication);
app.configure(mailer);
app.configure(
  feathersCasl({
    defaultAdapter: '@feathersjs/knex',
  }),
);
app.configure(services);
app.configure(channels);

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError],
  },
  before: {},
  after: {},
  error: {},
});
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: [],
});

export { app };
