// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../core/resource';
import { APIPromise } from '../core/api-promise';
import { RequestOptions } from '../internal/request-options';
import { path } from '../internal/utils/path';

export class Orgs extends APIResource {
  /**
   * Retrieve an organization by name.
   */
  retrieve(org: string, options?: RequestOptions): APIPromise<Org> {
    return this._client.get(path`/v0/orgs/${org}`, options);
  }

  /**
   * List organizations accessible to the current authentication method.
   */
  list(options?: RequestOptions): APIPromise<OrgListResponse> {
    return this._client.get('/v0/orgs', options);
  }
}

export interface Org {
  display_name: string | null;

  object: 'org';

  slug: string;
}

export interface OrgListResponse {
  data: Array<Org>;

  has_more: boolean;

  next_cursor?: string;
}

export declare namespace Orgs {
  export { type Org as Org, type OrgListResponse as OrgListResponse };
}
