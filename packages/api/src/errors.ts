import { TRPCError } from '@trpc/server';

const unauthorized = (msg?: string) => {
  return new TRPCError({
    code: 'UNAUTHORIZED',
    message: msg || 'Unauthorized',
  });
};

const internalServerError = (msg?: string) => {
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: msg || 'Internal server error',
  });
};

const badRequest = (msg?: string) => {
  return new TRPCError({
    code: 'BAD_REQUEST',
    message: msg || 'Bad request',
  });
};

const notFound = (msg?: string) => {
  return new TRPCError({
    code: 'NOT_FOUND',
    message: msg || 'Not found',
  });
};

const tooManyRequests = (msg?: string) => {
  return new TRPCError({
    code: 'TOO_MANY_REQUESTS',
    message: msg || 'Too many requests',
  });
};

const forbidden = (msg?: string) => {
  return new TRPCError({
    code: 'FORBIDDEN',
    message: msg || 'Forbidden',
  });
};

export const errors = {
  unauthorized,
  internalServerError,
  badRequest,
  notFound,
  tooManyRequests,
  forbidden,
};
