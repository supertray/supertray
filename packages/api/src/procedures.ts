import { authenticate } from './middlewares';
import { internal } from './middlewares/internal';
import { procedure } from './trpc';

export const publicProcedure = procedure;

export const authProcedure = publicProcedure.use(authenticate);

export const internalProcedure = publicProcedure.use(internal);
