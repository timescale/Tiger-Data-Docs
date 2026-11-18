/**
 * Topics of the Tiger Cloud REST reference: one page per resource in
 * `stainless/stainless.yml`, with every endpoint of the resource on it.
 *
 * Read by `astro.config.ts` (sidebar entries) and by the topic page
 * (`src/pages/reference/tiger-cloud-rest/[topic].astro`), so the two cannot
 * drift apart. Both run from the repository root.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

export const REST_REFERENCE_PATH = "/reference/tiger-cloud-rest";

export interface RestEndpoint {
  /** Anchor of the endpoint on its topic page. */
  id: string;
  /** Keys of the resource that owns the method in stainless.yml. */
  resource: string[];
  /** Method key in stainless.yml. */
  method: string;
  /** HTTP method, lower case. */
  verb: string;
  /** Endpoint summary from the OpenAPI spec, in sentence case. */
  label: string;
}

export interface RestTopic {
  slug: string;
  label: string;
  /** Keys of the topic's resource in stainless.yml. */
  resource: string[];
  endpoints: RestEndpoint[];
}

interface StainlessResource {
  methods?: Record<string, string | { endpoint: string }>;
  subresources?: Record<string, StainlessResource>;
}

/** Stainless and the spec capitalise every word; house style is sentence case. */
const ACRONYMS: Record<string, string> = {
  ha: "HA",
  vpc: "VPC",
  vpcs: "VPCs",
};

export function sentenceCase(label: string): string {
  return label
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (ACRONYMS[lower]) return ACRONYMS[lower];
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

const kebab = (key: string) => key.replaceAll("_", "-");

function readYaml(file: string) {
  return parse(readFileSync(resolve(process.cwd(), "stainless", file), "utf8"));
}

/** The API server from the spec, for the overview page. */
export function getRestBaseUrl(): string {
  const url: string | undefined = readYaml("openapi.yml").servers?.[0]?.url;
  if (!url) throw new Error("openapi.yml: no servers[0].url");
  return url;
}

let cached: RestTopic[] | undefined;

export function getRestTopics(): RestTopic[] {
  if (cached) return cached;

  const resources: Record<string, StainlessResource> = readYaml("stainless.yml").resources;
  const paths: Record<string, Record<string, { summary?: string }>> = readYaml("openapi.yml").paths;

  const endpointsOf = (resource: StainlessResource, keys: string[], idPrefix = ""): RestEndpoint[] =>
    Object.entries(resource.methods ?? {}).map(([method, value]) => {
      const endpoint = typeof value === "string" ? value : value.endpoint;
      if (!endpoint) {
        throw new Error(`stainless.yml: method ${[...keys, method].join(".")} has no endpoint`);
      }
      const [rawVerb, path] = endpoint.split(" ");
      const verb = rawVerb.toLowerCase();
      const summary = paths[path]?.[verb]?.summary?.trim();
      return {
        id: idPrefix + kebab(method),
        resource: keys,
        method,
        verb,
        label: sentenceCase(summary || method.replaceAll("_", " ")),
      };
    });

  const methodCount = (resource: StainlessResource) => Object.keys(resource.methods ?? {}).length;
  const isLeafWithOneMethod = (resource: StainlessResource) =>
    methodCount(resource) === 1 && !resource.subresources;

  const topics: RestTopic[] = [];
  const visit = (key: string, resource: StainlessResource, parents: string[]) => {
    const keys = [...parents, key];
    const endpoints = endpointsOf(resource, keys);
    const subresources = Object.entries(resource.subresources ?? {});
    // A subresource with a single endpoint does not earn a page: it joins its parent's.
    for (const [subKey, sub] of subresources) {
      if (isLeafWithOneMethod(sub)) {
        endpoints.push(...endpointsOf(sub, [...keys, subKey], `${kebab(subKey)}-`));
      }
    }
    if (endpoints.length > 0) {
      const ids = endpoints.map((endpoint) => endpoint.id);
      const repeated = ids.find((id, i) => ids.indexOf(id) !== i);
      if (repeated) {
        throw new Error(`REST topic ${keys.join(".")}: two endpoints share the anchor "${repeated}"`);
      }
      if (topics.some((topic) => topic.slug === kebab(key))) {
        throw new Error(`REST topics: two resources named "${key}" would share one page`);
      }
      topics.push({
        slug: kebab(key),
        label: sentenceCase(key.replaceAll("_", " ")),
        resource: keys,
        endpoints,
      });
    }
    for (const [subKey, sub] of subresources) {
      if (!isLeafWithOneMethod(sub)) visit(subKey, sub, keys);
    }
  };
  for (const [key, resource] of Object.entries(resources)) visit(key, resource, []);

  cached = topics;
  return topics;
}
