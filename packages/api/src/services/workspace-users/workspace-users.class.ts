// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type {
  WorkspaceUsers,
  WorkspaceUsersData,
  WorkspaceUsersPatch,
  WorkspaceUsersQuery,
} from './workspace-users.schema';
import type { Application } from '../../declarations';
import type { Id, NullableId, Params } from '@feathersjs/feathers';
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex';

import { KnexService } from '@feathersjs/knex';

export type * from './workspace-users.schema';

export interface WorkspaceUsersParams extends KnexAdapterParams<WorkspaceUsersQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class WorkspaceUsersService<
  ServiceParams extends Params = WorkspaceUsersParams,
> extends KnexService<
  WorkspaceUsers,
  WorkspaceUsersData,
  WorkspaceUsersParams,
  WorkspaceUsersPatch
> {
  async remove(id: Id, params?: ServiceParams): Promise<WorkspaceUsers>;

  async remove(id: null, params?: ServiceParams): Promise<WorkspaceUsers[]>;

  async remove(id: NullableId, params?: ServiceParams): Promise<WorkspaceUsers | WorkspaceUsers[]> {
    if (id === null) {
      return this.patch(null, { isActive: false }, params);
    }
    return this.patch(id, { isActive: false }, params);
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'supertray_workspace_users',
    filters: {
      $join: true,
    },
  };
};
