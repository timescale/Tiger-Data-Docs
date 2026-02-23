import type * as SDKJSON from '@stainless/sdk-json';
import { DocsLanguage, generateRouteList } from '@stainless-api/docs-ui/routing';
import { EXCLUDE_LANGUAGES } from 'virtual:stl-starlight-virtual-module';
import { api } from 'virtual:stainless-apis-manifest';
import { getSDKJSONInSSR } from '../specs/fetchSpecSSR';

export function generateDocsRoutes(spec: SDKJSON.Spec, excludeLanguages: DocsLanguage[] = EXCLUDE_LANGUAGES) {
  const paths = generateRouteList({
    spec,
    excludeLanguages,
  });
  const readmes = Object.entries(spec.readme)
    .filter(([language]) => language !== 'http')
    .filter(([language]) => !excludeLanguages.includes(language as DocsLanguage))
    .map(([language]) => ({
      slug: language,
      stainlessPath: null,
      language: language as DocsLanguage,
      title: 'Readme',
      kind: 'readme' as const,
    }));

  return [...paths, ...readmes].map(({ slug, stainlessPath, language, title, kind }) => {
    return {
      params: { slug },
      props: { stainlessPath, language, title, kind },
    };
  });
}

export async function generateAllDocsRoutes() {
  const uniquePaths = new Set<string>();

  const allRoutes = (
    await Promise.all(
      api.languages.map(async (entry) => {
        const spec = await getSDKJSONInSSR(entry.language);

        // this is super annoying, but preview worker _always_ generates HTTP routes
        // so, we exclude them unless the we're explicitly told to include them
        const excludeLanguages = [...EXCLUDE_LANGUAGES];
        if (entry.language !== 'http') {
          excludeLanguages.push('http');
        }

        const routes = generateDocsRoutes(spec, excludeLanguages);
        return routes.filter((route) => {
          if (uniquePaths.has(route.params.slug)) {
            return false;
          }
          uniquePaths.add(route.params.slug);
          return true;
        });
      }),
    )
  ).flat();

  return allRoutes;
}
