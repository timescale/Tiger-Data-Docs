/**
 * Content of the Tiger Cloud REST reference overview, shared by its HTML page
 * (`src/pages/reference/tiger-cloud-rest/overview.astro`) and its Markdown
 * route (`.../overview/index.md.ts`), so the two cannot drift apart.
 */
import * as C from "@constants";
import { getRestBaseUrl, getRestTopics, type RestTopic } from "./rest-topics";

export const TITLE = `${C.CLOUD_LONG} ${C.REST_SHORT}`;
export const DESCRIPTION = `Manage the resources in your ${C.CLOUD_LONG} project from any HTTP client.`;

export const INTRO =
  `The ${C.CLOUD_LONG} ${C.REST_SHORT} manages the resources in your ${C.CLOUD_LONG} project from any HTTP client: ` +
  `projects, services, VPCs and peerings, read replica sets, and service metrics. ${C.CLI_LONG} and ${C.MCP_LONG} are built on it.`;

export const AUTH_INTRO =
  "Requests use HTTP Basic Authentication with the public key and secret key of a client credential.";
export const AUTH_LINK = { text: "Create client credentials", path: "/integrate/find-connection-details", anchor: "create-client-credentials" };
export const AUTH_AFTER_LINK = `in ${C.CONSOLE}, then pass them with every request:`;
export const AUTH_EXAMPLE = `curl -u "<PUBLIC_KEY>:<SECRET_KEY>" ${getRestBaseUrl()}/projects`;
export const WALKTHROUGH = { before: "For a walkthrough, see", text: "Get started with the REST API", path: "/get-started/quickstart/rest-api" };

export const SECTIONS = [
  { slug: "authentication", text: "Authentication" },
  { slug: "base-url", text: "Base URL" },
  { slug: "resources", text: "Resources" },
];

/** Topics whose resource has no tag of its own in the spec; the spec's text is used for the rest. */
const DESCRIPTIONS: Record<string, string> = {
  peerings: "Connect a VPC to a VPC in your own cloud account.",
  metrics: "List the metric series available for a service, and read their data points and metadata.",
};

type SpecResource = { description?: string; subresources?: Record<string, SpecResource> };

/** The topics with a one-line description each, for the resource list. */
export function getRestOverviewTopics(spec: { resources: Record<string, SpecResource> }): (RestTopic & { description?: string })[] {
  const resourceAt = (keys: string[]) =>
    keys.reduce((parent: SpecResource, key) => parent.subresources![key], { subresources: spec.resources });

  // A resource without its own tag in the spec inherits its parent's description
  // (metrics shows the services text): use the spec's text only when it is the topic's own.
  return getRestTopics().map((topic) => {
    const description = resourceAt(topic.resource).description;
    const inherited = topic.resource
      .slice(0, -1)
      .some((_, i) => resourceAt(topic.resource.slice(0, i + 1)).description === description);
    return { ...topic, description: inherited ? DESCRIPTIONS[topic.slug] : description };
  });
}
