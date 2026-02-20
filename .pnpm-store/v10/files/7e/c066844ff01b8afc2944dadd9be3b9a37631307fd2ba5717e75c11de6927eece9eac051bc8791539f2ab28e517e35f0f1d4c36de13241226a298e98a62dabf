// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import * as Shared from '../shared';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';

export class TargetOutputs extends APIResource {
  /**
   * Retrieve a method to download an output for a given build target.
   *
   * If the requested type of output is `source`, and the requested output method is
   * `url`, a download link to a tarball of the source files is returned. If the
   * requested output method is `git`, a Git remote, ref, and access token (if
   * necessary) is returned.
   *
   * Otherwise, the possible types of outputs are specific to the requested target,
   * and the output method _must_ be `url`. See the documentation for `type` for more
   * information.
   */
  retrieve(
    query: TargetOutputRetrieveParams,
    options?: RequestOptions,
  ): APIPromise<TargetOutputRetrieveResponse> {
    return this._client.get('/v0/build_target_outputs', { query, ...options });
  }
}

export type TargetOutputRetrieveResponse =
  | TargetOutputRetrieveResponse.URL
  | TargetOutputRetrieveResponse.Git;

export namespace TargetOutputRetrieveResponse {
  export interface URL {
    output: 'url';

    target: Shared.Target;

    type: 'source' | 'dist' | 'wheel';

    /**
     * URL for direct download
     */
    url: string;
  }

  export interface Git {
    /**
     * Temporary GitHub access token
     */
    token: string;

    output: 'git';

    /**
     * Git reference (commit SHA, branch, or tag)
     */
    ref: string;

    target: Shared.Target;

    type: 'source' | 'dist' | 'wheel';

    /**
     * URL to git remote
     */
    url: string;
  }
}

export interface TargetOutputRetrieveParams {
  /**
   * Build ID
   */
  build_id: string;

  /**
   * SDK language target name
   */
  target:
    | 'node'
    | 'typescript'
    | 'python'
    | 'go'
    | 'java'
    | 'kotlin'
    | 'ruby'
    | 'terraform'
    | 'cli'
    | 'php'
    | 'csharp';

  type: 'source' | 'dist' | 'wheel';

  /**
   * Output format: url (download URL) or git (temporary access token).
   */
  output?: 'url' | 'git';
}

export declare namespace TargetOutputs {
  export {
    type TargetOutputRetrieveResponse as TargetOutputRetrieveResponse,
    type TargetOutputRetrieveParams as TargetOutputRetrieveParams,
  };
}
