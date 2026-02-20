import type * as SDKJSON from '@stainless/sdk-json';
import { printer } from '@stainless-api/docs-ui/markdown';
import z from 'zod';
import { getBodyParams } from '@stainless-api/docs-ui/utils';

export const ParamSchema = z.object({
  stainlessPath: z.string(),
  location: z.string(),
  key: z.string(),
  type: z.string(),
});

export type Param = z.infer<typeof ParamSchema>;

export function extractParams(spec: SDKJSON.Spec | undefined, method: SDKJSON.Method): Param[] {
  const httpDecls = spec?.decls?.http;
  if (!httpDecls) throw new Error('expected http language to be present in SDKJSON');
  const decl = httpDecls?.[method.stainlessPath];
  if (decl?.kind !== 'HttpDeclFunction') {
    throw new Error(
      'expected HttpDeclFunction at stainlessPath "' + method.stainlessPath + '", got ' + decl?.kind,
    );
  }
  const bodyParams = getBodyParams(decl);
  const params = [
    ...Object.entries(decl.paramsChildren ?? {}).map(([location, children]) => ({ location, children })),
    ...(bodyParams ? [{ location: 'body', children: bodyParams.params }] : []),
  ]
    .filter((e) => e.children.length)
    .flatMap(({ location, children }) =>
      children.map((child) => {
        const resolved = httpDecls[child];
        if (resolved?.kind !== 'HttpDeclProperty') {
          throw new Error(
            'expected HttpDeclProperty at stainlessPath "' + child + '", got ' + resolved?.kind,
          );
        }
        return {
          stainlessPath: resolved.stainlessPath,
          location,
          key: resolved.key,
          type: (resolved.optional ? 'optional ' : '') + printer.type('http', resolved.type),
        };
      }),
    );
  return params;
}
