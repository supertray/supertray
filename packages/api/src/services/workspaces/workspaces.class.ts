// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type {
  Workspaces,
  WorkspacesData,
  WorkspacesPatch,
  WorkspacesQuery,
} from './workspaces.schema';
import type { Application } from '../../declarations';
import type { Params } from '@feathersjs/feathers';
import type { KnexAdapterParams, KnexAdapterOptions } from '@feathersjs/knex';

import { MethodNotAllowed, NotAuthenticated } from '@feathersjs/errors';
import { KnexService } from '@feathersjs/knex';

export type * from './workspaces.schema';

export interface WorkspacesParams extends KnexAdapterParams<WorkspacesQuery> {}

// By default calls the standard Knex adapter service methods but can be customized with your own functionality.
export class WorkspacesService<ServiceParams extends Params = WorkspacesParams> extends KnexService<
  Workspaces,
  WorkspacesData,
  WorkspacesParams,
  WorkspacesPatch
> {
  private app: Application;

  constructor(options: KnexAdapterOptions, app: Application) {
    super(options);
    this.app = app;
  }

  async create(data: WorkspacesData, params?: WorkspacesParams): Promise<Workspaces>;

  async create(data: WorkspacesData[], params?: WorkspacesParams): Promise<Workspaces[]>;

  async create(
    data: WorkspacesData | WorkspacesData[],
    params?: ServiceParams,
  ): Promise<Workspaces | Workspaces[]> {
    if (Array.isArray(data)) {
      throw new MethodNotAllowed('Creating multiple workspaces is not allowed');
    }
    if (!params?.user) {
      throw new NotAuthenticated('Not authenticated');
    }
    const { query, ...allParams } = params;
    const { id: userId } = params.user;
    const workspace = await this._create(data, params);
    await this.app.service('workspace-users')._create(
      {
        workspaceId: workspace.id,
        userId,
        isActive: true,
        isOwner: true,
        isAdmin: true,
      },
      allParams,
    );
    return workspace;
  }
}

export const getOptions = (app: Application): KnexAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('postgresqlClient'),
    name: 'supertray_workspaces',
  };
};
