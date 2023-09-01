import type { ReadableTime } from './utils';

import path from 'path';

import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const portNumber = z.preprocess(
  (a) => parseInt(z.string().parse(a), 10),
  z.number().positive().max(9999),
);

const readableTime = z.preprocess(
  (v) => v as ReadableTime,
  z.string().regex(/^(\d+)(ms|s|m|h|d)$/, 'Must be a readable time, e.g. 1d, 1h, 1m, 1s, 1ms'),
);

const booleanString = z.preprocess((v) => v === 'true', z.boolean(), z.enum(['true', 'false']));

const storageSchema = z.union([
  z.object({
    STORAGE_TYPE: z.literal('local'),
    STORAGE_LOCAL_DIRECTORY: z.string(),
    STORAGE_S3_BUCKET: z.undefined(),
    STORAGE_S3_ACCESS_KEY_ID: z.undefined(),
    STORAGE_S3_SECRET_ACCESS_KEY: z.undefined(),
    STORAGE_S3_REGION: z.undefined(),
    STORAGE_S3_ENDPOINT: z.undefined(),
  }),
  z.object({
    STORAGE_TYPE: z.literal('s3'),
    STORAGE_LOCAL_DIRECTORY: z.undefined(),
    STORAGE_S3_BUCKET: z.string(),
    STORAGE_S3_ACCESS_KEY_ID: z.string(),
    STORAGE_S3_SECRET_ACCESS_KEY: z.string(),
    STORAGE_S3_REGION: z.string(),
    STORAGE_S3_ENDPOINT: z.string(),
  }),
]);

export const configuration = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  HOST: z.string().default('localhost'),
  PORT: portNumber.default(3300),
  PLAYGROUND_PORT: portNumber.default(3301),
  WEB_APP_URL: z.string().url(),
  DB_CLIENT: z.string(),
  DB_HOST: z.string(),
  DB_PORT: portNumber,
  DB_USER: z.string(),
  DB_PASS: z.string(),
  DB_NAME: z.string(),
  SECRET: z.string(),
  KEY: z.string().uuid(),
  AUTH_OTP_EXPIRES_IN: readableTime.default('5m'),
  AUTH_JWT_EXPIRES_IN: readableTime.default('1d'),
  AUTH_REFRESH_TOKEN_EXPIRES_IN: readableTime.default('30d'),
  AUTH_INVITES_EXPIRES_IN: readableTime.default('5d'),
  AUTH_JWT_ISSUER: z.string(),
  EMAIL_FROM: z.string(),
  EMAIL_SMTP_HOST: z.string(),
  EMAIL_SMTP_PORT: portNumber,
  EMAIL_SMTP_USER: z.string(),
  EMAIL_SMTP_PASSWORD: z.string(),
  EMAIL_SMTP_SECURE: booleanString,
  EMAIL_SMTP_REQUIRE_TLS: booleanString,
  WORKSPACE_ALLOW_PUBLIC_CREATION: booleanString.optional().default('false'),
});

export type Configuration = z.infer<typeof configuration>;

export const env = {
  ...configuration.parse(process.env),
  ...storageSchema.parse(process.env),
};
