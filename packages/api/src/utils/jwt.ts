import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { readableTimeToMilliseconds } from './ms';
import { createUuid } from './uuid';
import { env } from '../env';

export const createAccessToken = (userId: string, tokenId?: string) => {
  const now = Date.now();
  const expiration = now + readableTimeToMilliseconds(env.AUTH_JWT_EXPIRES_IN);
  const id = tokenId || createUuid();
  const accessToken = jwt.sign(
    {
      jti: id,
      sub: userId,
      exp: expiration / 1000,
      iss: env.AUTH_JWT_ISSUER,
    },
    env.SECRET,
  );
  const refreshTokenExpiration =
    now + readableTimeToMilliseconds(env.AUTH_REFRESH_TOKEN_EXPIRES_IN);
  const refreshToken = crypto.randomBytes(48).toString('hex');
  return {
    id,
    accessToken,
    refreshToken,
    expiration,
    refreshTokenExpiration,
  };
};

export const verifyAccessToken = (token: string, ignoreExpiration = false) => {
  const verified = jwt.verify(token, env.SECRET, {
    issuer: env.AUTH_JWT_ISSUER,
    ignoreExpiration,
  });
  if (typeof verified === 'string') {
    throw new Error('Invalid token');
  }
  return verified;
};
