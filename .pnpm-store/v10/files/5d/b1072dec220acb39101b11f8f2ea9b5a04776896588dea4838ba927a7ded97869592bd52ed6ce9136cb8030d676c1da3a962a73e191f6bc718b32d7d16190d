// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as Shared from '../shared';
import * as BranchesAPI from './branches';
import {
  BranchCreateParams,
  BranchDeleteParams,
  BranchDeleteResponse,
  BranchListParams,
  BranchListResponse,
  BranchListResponsesPage,
  BranchRebaseParams,
  BranchResetParams,
  BranchRetrieveParams,
  Branches,
  ProjectBranch,
} from './branches';
import * as ConfigsAPI from './configs';
import {
  ConfigGuessParams,
  ConfigGuessResponse,
  ConfigRetrieveParams,
  ConfigRetrieveResponse,
  Configs,
} from './configs';
import { APIPromise } from '../../core/api-promise';
import { Page, type PageParams, PagePromise } from '../../core/pagination';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

export class Projects extends APIResource {
  branches: BranchesAPI.Branches = new BranchesAPI.Branches(this._client);
  configs: ConfigsAPI.Configs = new ConfigsAPI.Configs(this._client);

  /**
   * Create a new project.
   */
  create(body: ProjectCreateParams, options?: RequestOptions): APIPromise<Project> {
    return this._client.post('/v0/projects', { body, ...options });
  }

  /**
   * Retrieve a project by name.
   */
  retrieve(
    params: ProjectRetrieveParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Project> {
    const { project = this._client.project } = params ?? {};
    return this._client.get(path`/v0/projects/${project}`, options);
  }

  /**
   * Update a project's properties.
   */
  update(params: ProjectUpdateParams | null | undefined = {}, options?: RequestOptions): APIPromise<Project> {
    const { project = this._client.project, ...body } = params ?? {};
    return this._client.patch(path`/v0/projects/${project}`, { body, ...options });
  }

  /**
   * List projects in an organization, from oldest to newest.
   */
  list(
    query: ProjectListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<ProjectsPage, Project> {
    return this._client.getAPIList('/v0/projects', Page<Project>, { query, ...options });
  }
}

export type ProjectsPage = Page<Project>;

/**
 * A project is a collection of SDKs generated from the same set of config files.
 */
export interface Project {
  config_repo: string;

  display_name: string | null;

  object: 'project';

  org: string;

  slug: string;

  targets: Array<Shared.Target>;
}

export interface ProjectCreateParams {
  /**
   * Human-readable project name
   */
  display_name: string;

  /**
   * Organization name
   */
  org: string;

  /**
   * File contents to commit
   */
  revision: { [key: string]: Shared.FileInput };

  /**
   * Project name/slug
   */
  slug: string;

  /**
   * Targets to generate for
   */
  targets: Array<Shared.Target>;
}

export interface ProjectRetrieveParams {
  project?: string;
}

export interface ProjectUpdateParams {
  /**
   * Path param:
   */
  project?: string;

  /**
   * Body param:
   */
  display_name?: string | null;
}

export interface ProjectListParams extends PageParams {
  /**
   * Maximum number of projects to return, defaults to 10 (maximum: 100).
   */
  limit?: number;

  org?: string;
}

Projects.Branches = Branches;
Projects.Configs = Configs;

export declare namespace Projects {
  export {
    type Project as Project,
    type ProjectsPage as ProjectsPage,
    type ProjectCreateParams as ProjectCreateParams,
    type ProjectRetrieveParams as ProjectRetrieveParams,
    type ProjectUpdateParams as ProjectUpdateParams,
    type ProjectListParams as ProjectListParams,
  };

  export {
    Branches as Branches,
    type ProjectBranch as ProjectBranch,
    type BranchListResponse as BranchListResponse,
    type BranchDeleteResponse as BranchDeleteResponse,
    type BranchListResponsesPage as BranchListResponsesPage,
    type BranchCreateParams as BranchCreateParams,
    type BranchRetrieveParams as BranchRetrieveParams,
    type BranchListParams as BranchListParams,
    type BranchDeleteParams as BranchDeleteParams,
    type BranchRebaseParams as BranchRebaseParams,
    type BranchResetParams as BranchResetParams,
  };

  export {
    Configs as Configs,
    type ConfigRetrieveResponse as ConfigRetrieveResponse,
    type ConfigGuessResponse as ConfigGuessResponse,
    type ConfigRetrieveParams as ConfigRetrieveParams,
    type ConfigGuessParams as ConfigGuessParams,
  };
}
