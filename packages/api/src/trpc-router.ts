import { router } from './trpc';
import { authRouter } from './trpc-routers/auth.handler';
import { userRouter } from './trpc-routers/users.handler';
import { workspaceUserRouter } from './trpc-routers/workspace-users.handler';
import { workspaceRouter } from './trpc-routers/workspaces.handler';

export const trpcRouter = router({
  auth: authRouter,
  user: userRouter,
  workspace: workspaceRouter,
  workspaceUser: workspaceUserRouter,
});

// Export type router type signature,
// NOT the router itself.
export type TrpcRouter = typeof trpcRouter;
