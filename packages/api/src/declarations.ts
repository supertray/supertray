// For more information about this file see https://dove.feathersjs.com/guides/cli/typescript.html
import type { ApplicationConfiguration } from './configuration';
import type { User } from './services/users/users';
import type { HookContext as FeathersHookContext } from '@feathersjs/feathers';
import type { Application as FeathersApplication } from '@feathersjs/koa';

import { NextFunction } from '@feathersjs/feathers';

export { NextFunction };

// The types for app.get(name) and app.set(name)
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Configuration extends ApplicationConfiguration {}

// A mapping of service names to types. Will be extended in service files.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ServiceTypes {}

// The application instance type that will be used everywhere else
export type Application = FeathersApplication<ServiceTypes, Configuration>;

// The context for hook functions - can be typed with a service class
export type HookContext<S = any> = FeathersHookContext<Application, S>;

// Add the user as an optional property to all params
declare module '@feathersjs/feathers' {
  interface Params {
    user?: User;
  }
}
