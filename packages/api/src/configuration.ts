import type { Static } from '@feathersjs/typebox';

import { Type, getValidator, defaultAppConfiguration } from '@feathersjs/typebox';

import { dataValidator } from './validators';

export const configurationSchema = Type.Intersect([
  defaultAppConfiguration,
  Type.Object({
    host: Type.String(),
    port: Type.Number(),
    public: Type.String(),
    authExtension: Type.Object({
      refreshTokenExpiresIn: Type.String(),
    }),
    users: Type.Object({
      externalSignup: Type.Boolean(),
    }),
    mailer: Type.Object({
      host: Type.String(),
      port: Type.Number(),
      secure: Type.Boolean(),
      requireTLS: Type.Boolean(),
      auth: Type.Object({
        user: Type.String(),
        pass: Type.String(),
      }),
    }),
  }),
]);

export type ApplicationConfiguration = Static<typeof configurationSchema>;

export const configurationValidator = getValidator(configurationSchema, dataValidator);
