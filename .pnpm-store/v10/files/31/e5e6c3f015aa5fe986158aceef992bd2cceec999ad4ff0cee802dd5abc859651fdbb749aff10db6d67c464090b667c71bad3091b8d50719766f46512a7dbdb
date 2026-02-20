// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as BuildsAPI from '../builds/builds';
import { APIPromise } from '../../core/api-promise';
import { Page, type PageParams, PagePromise } from '../../core/pagination';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

export class Branches extends APIResource {
  /**
   * Create a new branch for a project.
   *
   * The branch inherits the config files from the revision pointed to by the
   * `branch_from` parameter. In addition, if the revision is a branch name, the
   * branch will also inherit custom code changes from that branch.
   */
  create(params: BranchCreateParams, options?: RequestOptions): APIPromise<ProjectBranch> {
    const { project = this._client.project, ...body } = params;
    return this._client.post(path`/v0/projects/${project}/branches`, { body, ...options });
  }

  /**
   * Retrieve a project branch by name.
   */
  retrieve(
    branch: string,
    params: BranchRetrieveParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ProjectBranch> {
    const { project = this._client.project } = params ?? {};
    return this._client.get(path`/v0/projects/${project}/branches/${branch}`, options);
  }

  /**
   * Retrieve a project branch by name.
   */
  list(
    params: BranchListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<BranchListResponsesPage, BranchListResponse> {
    const { project = this._client.project, ...query } = params ?? {};
    return this._client.getAPIList(path`/v0/projects/${project}/branches`, Page<BranchListResponse>, {
      query,
      ...options,
    });
  }

  /**
   * Delete a project branch by name.
   */
  delete(
    branch: string,
    params: BranchDeleteParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<unknown> {
    const { project = this._client.project } = params ?? {};
    return this._client.delete(path`/v0/projects/${project}/branches/${branch}`, options);
  }

  /**
   * Rebase a project branch.
   *
   * The branch is rebased onto the `base` branch or commit SHA, inheriting any
   * config and custom code changes.
   */
  rebase(
    branch: string,
    params: BranchRebaseParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ProjectBranch> {
    const { project = this._client.project, base } = params ?? {};
    return this._client.put(path`/v0/projects/${project}/branches/${branch}/rebase`, {
      query: { base },
      ...options,
    });
  }

  /**
   * Reset a project branch.
   *
   * If `branch` === `main`, the branch is reset to `target_config_sha`. Otherwise,
   * the branch is reset to `main`.
   */
  reset(
    branch: string,
    params: BranchResetParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ProjectBranch> {
    const { project = this._client.project, target_config_sha } = params ?? {};
    return this._client.put(path`/v0/projects/${project}/branches/${branch}/reset`, {
      query: { target_config_sha },
      ...options,
    });
  }
}

export type BranchListResponsesPage = Page<BranchListResponse>;

/**
 * A project branch names a line of development for a project. Like a Git branch,
 * it points to a Git commit with a set of config files. In addition, a project
 * branch also points to a set of custom code changes, corresponding to Git
 * branches in the staging repos.
 */
export interface ProjectBranch {
  /**
   * Branch name
   */
  branch: string;

  /**
   * A Git commit that points to the latest set of config files on a given branch.
   */
  config_commit: ProjectBranch.ConfigCommit;

  latest_build: BuildsAPI.Build | null;

  object: 'project_branch';

  org: string;

  /**
   * Project name
   */
  project: string;
}

export namespace ProjectBranch {
  /**
   * A Git commit that points to the latest set of config files on a given branch.
   */
  export interface ConfigCommit {
    repo: ConfigCommit.Repo;

    sha: string;
  }

  export namespace ConfigCommit {
    export interface Repo {
      branch: string;

      name: string;

      owner: string;
    }
  }
}

/**
 * A project branch names a line of development for a project. Like a Git branch,
 * it points to a Git commit with a set of config files. In addition, a project
 * branch also points to a set of custom code changes, corresponding to Git
 * branches in the staging repos.
 */
export interface BranchListResponse {
  /**
   * Branch name
   */
  branch: string;

  /**
   * A Git commit that points to the latest set of config files on a given branch.
   */
  config_commit: BranchListResponse.ConfigCommit;

  latest_build_id: string;

  object: 'project_branch';

  org: string;

  /**
   * Project name
   */
  project: string;
}

export namespace BranchListResponse {
  /**
   * A Git commit that points to the latest set of config files on a given branch.
   */
  export interface ConfigCommit {
    repo: ConfigCommit.Repo;

    sha: string;
  }

  export namespace ConfigCommit {
    export interface Repo {
      branch: string;

      name: string;

      owner: string;
    }
  }
}

export type BranchDeleteResponse = unknown;

export interface BranchCreateParams {
  /**
   * Path param:
   */
  project?: string;

  /**
   * Body param: Branch name
   */
  branch: string;

  /**
   * Body param: Branch or commit SHA to branch from
   */
  branch_from: string;

  /**
   * Body param: Whether to throw an error if the branch already exists. Defaults to
   * false.
   */
  force?: boolean;
}

export interface BranchRetrieveParams {
  project?: string;
}

export interface BranchListParams extends PageParams {
  /**
   * Path param:
   */
  project?: string;

  /**
   * Query param: Maximum number of items to return, defaults to 10 (maximum: 100).
   */
  limit?: number;
}

export interface BranchDeleteParams {
  project?: string;
}

export interface BranchRebaseParams {
  /**
   * Path param:
   */
  project?: string;

  /**
   * Query param: The branch or commit SHA to rebase onto. Defaults to "main".
   */
  base?: string;
}

export interface BranchResetParams {
  /**
   * Path param:
   */
  project?: string;

  /**
   * Query param: The commit SHA to reset the main branch to. Required if resetting
   * the main branch; disallowed otherwise.
   */
  target_config_sha?: string;
}

export declare namespace Branches {
  export {
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
}
