import type { WorkspaceActivity } from './events.schema';

import { observable } from '@trpc/server/observable';
import { z } from 'zod';

import { authProcedure } from '../procedures';
import { router } from '../trpc';

export const eventRouter = router({
  onWorkspaceActivity: authProcedure
    .input(z.string().uuid())
    .subscription(async ({ ctx, input }) => {
      ctx.abilities.can('listen', 'Events_OnWorkspaceActivity', { workspaceId: input });

      return observable<WorkspaceActivity>((emit) => {
        const onActivity = (data: WorkspaceActivity) => {
          if (data.workspaceId !== input) return;
          emit.next(data);
        };
        ctx.ee.bus.on('workspace-activity', onActivity);
        return () => {
          ctx.ee.bus.off('workspace-activity', onActivity);
        };
      });
    }),
});
