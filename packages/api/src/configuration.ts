import type { Static } from '@feathersjs/typebox';

import {
  Type,
  getValidator,
  authenticationSettingsSchema,
  sqlSettingsSchema,
} from '@feathersjs/typebox';

import { dataValidator } from './validators';

const defaultSchema = Type.Object(
  {
    authentication: authenticationSettingsSchema,
    postgresql: sqlSettingsSchema,
    paginate: Type.Optional(
      Type.Object(
        {
          default: Type.Number(),
          max: Type.Number(),
        },
        { additionalProperties: false },
      ),
    ),
    origins: Type.Optional(Type.Array(Type.String())),
  },
  { $id: 'ApplicationConfiguration', additionalProperties: false },
);

export const configurationSchema = Type.Intersect([
  defaultSchema,
  Type.Object({
    host: Type.String(),
    port: Type.Number(),
    public: Type.String(),
    authExtension: Type.Object({
      refreshTokenExpiresIn: Type.String(),
      allowEmailChange: Type.Boolean(),
    }),
    users: Type.Object({
      externalSignup: Type.Boolean(),
    }),
    mailer: Type.Object({
      from: Type.String(),
      host: Type.String(),
      port: Type.Number(),
      secure: Type.Boolean(),
      requireTLS: Type.Boolean(),
      auth: Type.Object({
        user: Type.String(),
        pass: Type.String(),
      }),
    }),
    webClient: Type.Object({
      url: Type.String(),
    }),
  }),
]);

export type ApplicationConfiguration = Static<typeof configurationSchema>;

export const configurationValidator = getValidator(configurationSchema, dataValidator);
