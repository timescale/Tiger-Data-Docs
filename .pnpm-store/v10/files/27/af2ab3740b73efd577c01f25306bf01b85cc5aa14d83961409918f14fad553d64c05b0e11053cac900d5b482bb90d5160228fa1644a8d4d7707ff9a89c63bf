// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.

import { APIResource } from '../../core/resource';
import { Page, type PageParams, PagePromise } from '../../core/pagination';
import { RequestOptions } from '../../internal/request-options';
import { path } from '../../internal/utils/path';

export class Diagnostics extends APIResource {
  /**
   * Get the list of diagnostics for a given build.
   *
   * If no language targets are specified, diagnostics for all languages are
   * returned.
   */
  list(
    buildID: string,
    query: DiagnosticListParams | null | undefined = {},
    options?: RequestOptions,
  ): PagePromise<BuildDiagnosticsPage, BuildDiagnostic> {
    return this._client.getAPIList(path`/v0/builds/${buildID}/diagnostics`, Page<BuildDiagnostic>, {
      query,
      ...options,
    });
  }
}

export type BuildDiagnosticsPage = Page<BuildDiagnostic>;

export interface BuildDiagnostic {
  /**
   * The kind of diagnostic.
   */
  code: string;

  /**
   * Whether the diagnostic is ignored in the Stainless config.
   */
  ignored: boolean;

  /**
   * The severity of the diagnostic.
   */
  level: 'fatal' | 'error' | 'warning' | 'note';

  /**
   * A description of the diagnostic.
   */
  message: string;

  more: BuildDiagnosticMore | null;

  /**
   * A JSON pointer to a relevant field in the Stainless config.
   */
  config_ref?: string;

  /**
   * A JSON pointer to a relevant field in the OpenAPI spec.
   */
  oas_ref?: string;
}

export type BuildDiagnosticMore = BuildDiagnosticMore.Markdown | BuildDiagnosticMore.Raw;

export namespace BuildDiagnosticMore {
  export interface Markdown {
    markdown: string;

    type: 'markdown';
  }

  export interface Raw {
    raw: string;

    type: 'raw';
  }
}

export interface DiagnosticListParams extends PageParams {
  /**
   * Maximum number of diagnostics to return, defaults to 100 (maximum: 100)
   */
  limit?: number;

  /**
   * Includes the given severity and above (fatal > error > warning > note).
   */
  severity?: 'fatal' | 'error' | 'warning' | 'note';

  /**
   * Optional comma-delimited list of language targets to filter diagnostics by
   */
  targets?: string;
}

export declare namespace Diagnostics {
  export {
    type BuildDiagnostic as BuildDiagnostic,
    type BuildDiagnosticMore as BuildDiagnosticMore,
    type BuildDiagnosticsPage as BuildDiagnosticsPage,
    type DiagnosticListParams as DiagnosticListParams,
  };
}
