import { ReactNode } from 'react';
import * as SDKJSON from '@stainless/sdk-json';
import { useSpec } from '@stainless-api/docs-ui/contexts';
import { extractParams, Param } from './spec-helpers';
import type { SnippetStainlessIslandProps } from './props';

/** Load and process the spec on the server side to avoid inflating client bundle */
export function RequestBuilder({
  className,
  children,
  method,
}: {
  className: string;
  children: ReactNode;
  method: SDKJSON.Method;
}) {
  let params: Param[];
  const spec = useSpec();
  try {
    if (!spec) throw new Error('Spec is required for RequestBuilder');
    params = spec && extractParams(spec, method);
  } catch (e) {
    console.warn(e);
    return <div className={className}>{children}</div>;
  }
  const [httpMethod, path] = method.endpoint.split(' ') as [string, string];

  return (
    <stl-island component="SnippetStainlessIsland" className={className}>
      {/* Pass state down to the client component. TODO: we need a better solution for this */}
      <template className="request-builder-props">
        {JSON.stringify({ method: httpMethod, path, params } satisfies SnippetStainlessIslandProps)}
      </template>
      {children}
    </stl-island>
  );
}
