import { authenticate } from './middlewares';
import { procedure } from './trpc';

export const publicProcedure = procedure;

export const authProcedure = procedure.use(authenticate);
