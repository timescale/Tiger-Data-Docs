/**
 * Markdown version of a REST topic page: every endpoint of the topic, rendered
 * by Stainless's own Markdown route, under one heading. Stainless serves
 * Markdown per endpoint only; this is the one-page-per-topic counterpart.
 */
import type { APIRoute } from "astro";
import { getSDKJSONInSSR } from "@stainless-api/docs/specs/fetchSpecSSR";
import { GET as endpointMarkdown } from "@stainless-plugin/routes/markdown";
import { getRestTopics, type RestTopic } from "../../../../lib/rest-topics";

export const prerender = true;

export function getStaticPaths() {
  return getRestTopics().map((topic) => ({ params: { topic: topic.slug }, props: { topic } }));
}

export const GET: APIRoute = async (context) => {
  const { topic } = context.props as { topic: RestTopic };
  const spec = await getSDKJSONInSSR("http");
  const resourceAt = (keys: string[]) =>
    keys.reduce((parent: any, key) => parent.subresources[key], { subresources: spec.resources });

  const sections = [`# ${topic.label}`];
  for (const endpoint of topic.endpoints) {
    const method = resourceAt(endpoint.resource)?.methods?.[endpoint.method];
    if (!method) {
      throw new Error(`REST topic ${topic.slug}: ${endpoint.method} is in stainless.yml but not in the generated spec`);
    }
    // Only the fields the route reads: spreading the context touches `clientAddress`, which throws when prerendering.
    const response = await endpointMarkdown({
      props: { stainlessPath: method.stainlessPath, language: "http", kind: "http_method" },
      routePattern: "",
    } as any);
    sections.push(await response.text());
  }

  return new Response(sections.join("\n\n"), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
};
