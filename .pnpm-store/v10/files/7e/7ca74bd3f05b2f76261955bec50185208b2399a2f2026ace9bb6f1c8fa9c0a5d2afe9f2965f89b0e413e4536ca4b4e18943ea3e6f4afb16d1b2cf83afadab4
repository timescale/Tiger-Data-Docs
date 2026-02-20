// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as BuildsAPI from './builds';
import * as Shared from '../shared';
import * as DiagnosticsAPI from './diagnostics';
import {
  BuildDiagnostic,
  BuildDiagnosticMore,
  BuildDiagnosticsPage,
  DiagnosticListParams,
  Diagnostics,
} from './diagnostics';
import * as TargetOutputsAPI from './target-outputs';
import { TargetOutputRetrieveParams, TargetOutputRetrieveResponse, TargetOutputs } from './target-outputs';
import { APIPromise } from '../../core/api-promise';
import { Page, type PageParams, PagePromise } from '../../core/pagination';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

export class Builds extends APIResource {
  diagnostics: DiagnosticsAPI.Diagnostics = new DiagnosticsAPI.Diagnostics(this._client);
  targetOutputs: TargetOutputsAPI.TargetOutputs = new TargetOutputsAPI.TargetOutputs(this._client);

  /**
   * Create a build, on top of a project branch, against a given input revision.
   *
   * The project branch will be modified so that its latest set of config files
   * points to the one specified by the input revision.
   */
  create(params: BuildCreateParams, options?: RequestOptions): APIPromise<Build> {
    const { project = this._client.project, ...body } = params;
    return this._client.post('/v0/builds', { body: { project, ...body }, ...options });
  }

  /**
   * Retrieve a build by its ID.
   */
  retrieve(buildID: string, options?: RequestOptions): APIPromise<Build> {
    return this._client.get(path`/v0/builds/${buildID}`, options);
  }

  /**
   * List user-triggered builds for a given project.
   *
   * An optional revision can be specified to filter by config commit SHA, or hashes
   * of file contents.
   */
  list(
    params: BuildListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<BuildsPage, Build> {
    const { project = this._client.project, ...query } = params ?? {};
    return this._client.getAPIList('/v0/builds', Page<Build>, { query: { project, ...query }, ...options });
  }

  /**
   * Create two builds whose outputs can be directly compared with each other.
   *
   * Created builds _modify_ their project branches so that their latest sets of
   * config files point to the ones specified by the input revision.
   *
   * This endpoint is useful because a build has more inputs than the set of config
   * files it uses, so comparing two builds directly may return spurious differences.
   * Builds made via this endpoint are guaranteed to have differences arising from
   * the set of config files, and any custom code.
   */
  compare(params: BuildCompareParams, options?: RequestOptions): APIPromise<BuildCompareResponse> {
    const { project = this._client.project, ...body } = params;
    return this._client.post('/v0/builds/compare', { body: { project, ...body }, ...options });
  }
}

export type BuildsPage = Page<Build>;

export interface Build {
  /**
   * Build ID
   */
  id: string;

  config_commit: string;

  created_at: string;

  documented_spec: Build.UnionMember0 | Build.UnionMember1 | null;

  object: 'build';

  org: string;

  project: string;

  targets: Build.Targets;

  updated_at: string;
}

export namespace Build {
  export interface UnionMember0 {
    content: string;

    type: 'content';
  }

  export interface UnionMember1 {
    expires: string;

    type: 'url';

    url: string;
  }

  export interface Targets {
    cli?: BuildsAPI.BuildTarget;

    csharp?: BuildsAPI.BuildTarget;

    go?: BuildsAPI.BuildTarget;

    java?: BuildsAPI.BuildTarget;

    kotlin?: BuildsAPI.BuildTarget;

    node?: BuildsAPI.BuildTarget;

    php?: BuildsAPI.BuildTarget;

    python?: BuildsAPI.BuildTarget;

    ruby?: BuildsAPI.BuildTarget;

    terraform?: BuildsAPI.BuildTarget;

    typescript?: BuildsAPI.BuildTarget;
  }
}

export interface BuildTarget {
  commit: BuildTarget.NotStarted | BuildTarget.Queued | BuildTarget.InProgress | BuildTarget.Completed;

  install_url: string | null;

  lint: CheckStep;

  object: 'build_target';

  status: 'not_started' | 'codegen' | 'postgen' | 'completed';

  test: CheckStep;

  build?: CheckStep;
}

export namespace BuildTarget {
  export interface NotStarted {
    status: 'not_started';
  }

  export interface Queued {
    status: 'queued';
  }

  export interface InProgress {
    status: 'in_progress';
  }

  export interface Completed {
    completed: Completed.Completed;

    status: 'completed';
  }

  export namespace Completed {
    export interface Completed {
      commit: Shared.Commit | null;

      conclusion:
        | 'error'
        | 'warning'
        | 'note'
        | 'success'
        | 'merge_conflict'
        | 'upstream_merge_conflict'
        | 'fatal'
        | 'payment_required'
        | 'cancelled'
        | 'timed_out'
        | 'noop'
        | 'version_bump';

      merge_conflict_pr: Completed.MergeConflictPr | null;
    }

    export namespace Completed {
      export interface MergeConflictPr {
        number: number;

        repo: MergeConflictPr.Repo;
      }

      export namespace MergeConflictPr {
        export interface Repo {
          name: string;

          owner: string;
        }
      }
    }
  }
}

export type CheckStep = CheckStep.NotStarted | CheckStep.Queued | CheckStep.InProgress | CheckStep.Completed;

export namespace CheckStep {
  export interface NotStarted {
    status: 'not_started';
  }

  export interface Queued {
    status: 'queued';
  }

  export interface InProgress {
    status: 'in_progress';
  }

  export interface Completed {
    completed: Completed.Completed;

    status: 'completed';
  }

  export namespace Completed {
    export interface Completed {
      conclusion:
        | 'success'
        | 'failure'
        | 'skipped'
        | 'cancelled'
        | 'action_required'
        | 'neutral'
        | 'timed_out';

      url: string | null;
    }
  }
}

export interface BuildCompareResponse {
  base: Build;

  head: Build;
}

export interface BuildCreateParams {
  /**
   * Project name
   */
  project?: string;

  /**
   * Specifies what to build: a branch name, commit SHA, merge command
   * ("base..head"), or file contents.
   */
  revision: string | { [key: string]: Shared.FileInput };

  /**
   * Whether to allow empty commits (no changes). Defaults to false.
   */
  allow_empty?: boolean;

  /**
   * The project branch to use for the build. If not specified, the branch is
   * inferred from the `revision`, and will 400 when that is not possible.
   */
  branch?: string;

  /**
   * Optional commit message to use when creating a new commit.
   */
  commit_message?: string;

  /**
   * Optional commit messages to use for each SDK when making a new commit. SDKs not
   * represented in this object will fallback to the optional `commit_message`
   * parameter, or will fallback further to the default commit message.
   */
  target_commit_messages?: BuildCreateParams.TargetCommitMessages;

  /**
   * Optional list of SDK targets to build. If not specified, all configured targets
   * will be built.
   */
  targets?: Array<Shared.Target>;
}

export namespace BuildCreateParams {
  /**
   * Optional commit messages to use for each SDK when making a new commit. SDKs not
   * represented in this object will fallback to the optional `commit_message`
   * parameter, or will fallback further to the default commit message.
   */
  export interface TargetCommitMessages {
    cli?: string;

    csharp?: string;

    go?: string;

    java?: string;

    kotlin?: string;

    node?: string;

    php?: string;

    python?: string;

    ruby?: string;

    terraform?: string;

    typescript?: string;
  }
}

export interface BuildListParams extends PageParams {
  /**
   * Project name
   */
  project?: string;

  /**
   * Branch name
   */
  branch?: string;

  /**
   * Maximum number of builds to return, defaults to 10 (maximum: 100).
   */
  limit?: number;

  /**
   * A config commit SHA used for the build
   */
  revision?: string | { [key: string]: BuildListParams.unnamed_schema_with_map_parent_0 };
}

export namespace BuildListParams {
  export interface unnamed_schema_with_map_parent_0 {
    /**
     * File content hash
     */
    hash: string;
  }
}

export interface BuildCompareParams {
  /**
   * Parameters for the base build
   */
  base: BuildCompareParams.Base;

  /**
   * Parameters for the head build
   */
  head: BuildCompareParams.Head;

  /**
   * Project name
   */
  project?: string;

  /**
   * Optional list of SDK targets to build. If not specified, all configured targets
   * will be built.
   */
  targets?: Array<Shared.Target>;
}

export namespace BuildCompareParams {
  /**
   * Parameters for the base build
   */
  export interface Base {
    /**
     * Branch to use. When using a branch name as revision, this must match or be
     * omitted.
     */
    branch: string;

    /**
     * Specifies what to build: a branch name, a commit SHA, or file contents.
     */
    revision: string | { [key: string]: Shared.FileInput };

    /**
     * Optional commit message to use when creating a new commit.
     */
    commit_message?: string;
  }

  /**
   * Parameters for the head build
   */
  export interface Head {
    /**
     * Branch to use. When using a branch name as revision, this must match or be
     * omitted.
     */
    branch: string;

    /**
     * Specifies what to build: a branch name, a commit SHA, or file contents.
     */
    revision: string | { [key: string]: Shared.FileInput };

    /**
     * Optional commit message to use when creating a new commit.
     */
    commit_message?: string;
  }
}

Builds.Diagnostics = Diagnostics;
Builds.TargetOutputs = TargetOutputs;

export declare namespace Builds {
  export {
    type Build as Build,
    type BuildTarget as BuildTarget,
    type CheckStep as CheckStep,
    type BuildCompareResponse as BuildCompareResponse,
    type BuildsPage as BuildsPage,
    type BuildCreateParams as BuildCreateParams,
    type BuildListParams as BuildListParams,
    type BuildCompareParams as BuildCompareParams,
  };

  export {
    Diagnostics as Diagnostics,
    type BuildDiagnostic as BuildDiagnostic,
    type BuildDiagnosticMore as BuildDiagnosticMore,
    type BuildDiagnosticsPage as BuildDiagnosticsPage,
    type DiagnosticListParams as DiagnosticListParams,
  };

  export {
    TargetOutputs as TargetOutputs,
    type TargetOutputRetrieveResponse as TargetOutputRetrieveResponse,
    type TargetOutputRetrieveParams as TargetOutputRetrieveParams,
  };
}
