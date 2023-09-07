import type { WorkspaceActivity } from './schema';

import EventEmitter from 'events';

import { workspaceActivitySchema } from './schema';

export const bus = new EventEmitter();

export const emit = {
  workspaceActivity: (activity: WorkspaceActivity) => {
    const validated = workspaceActivitySchema.parse(activity);
    bus.emit('workspace-activity', validated);
  },
};
