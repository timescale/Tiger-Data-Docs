// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import { APIPromise } from '../../core/api-promise';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

export class Configs extends APIResource {
  /**
   * Retrieve the configuration files for a given project.
   */
  retrieve(
    params: ConfigRetrieveParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ConfigRetrieveResponse> {
    const { project = this._client.project, ...query } = params ?? {};
    return this._client.get(path`/v0/projects/${project}/configs`, { query, ...options });
  }

  /**
   * Generate suggestions for changes to config files based on an OpenAPI spec.
   */
  guess(params: ConfigGuessParams, options?: RequestOptions): APIPromise<ConfigGuessResponse> {
    const { project = this._client.project, ...body } = params;
    return this._client.post(path`/v0/projects/${project}/configs/guess`, { body, ...options });
  }
}

/**
 * Config files contents
 */
export type ConfigRetrieveResponse = { [key: string]: ConfigRetrieveResponse.item };

export namespace ConfigRetrieveResponse {
  export interface item {
    /**
     * The file content
     */
    content: string;
  }
}

/**
 * Config files contents
 */
export type ConfigGuessResponse = { [key: string]: ConfigGuessResponse.item };

export namespace ConfigGuessResponse {
  export interface item {
    /**
     * The file content
     */
    content: string;
  }
}

export interface ConfigRetrieveParams {
  /**
   * Path param:
   */
  project?: string;

  /**
   * Query param: Branch name, defaults to "main".
   */
  branch?: string;

  /**
   * Query param:
   */
  include?: string;
}

export interface ConfigGuessParams {
  /**
   * Path param:
   */
  project?: string;

  /**
   * Body param: OpenAPI spec
   */
  spec: string;

  /**
   * Body param: Branch name
   */
  branch?: string;
}

export declare namespace Configs {
  export {
    type ConfigRetrieveResponse as ConfigRetrieveResponse,
    type ConfigGuessResponse as ConfigGuessResponse,
    type ConfigRetrieveParams as ConfigRetrieveParams,
    type ConfigGuessParams as ConfigGuessParams,
  };
}
