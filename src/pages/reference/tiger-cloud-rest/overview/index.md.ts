/**
 * Markdown version of the REST reference overview, for AI clients and the
 * `Copy Markdown` control. Stainless generates Markdown for prose pages, but
 * skips everything under the API reference path, so this page serves its own.
 */
import type { APIRoute } from "astro";
import { getSDKJSONInSSR } from "@stainless-api/docs/specs/fetchSpecSSR";
import { getRestBaseUrl, REST_REFERENCE_PATH } from "../../../../lib/rest-topics";
import * as overview from "../../../../lib/rest-overview";

export const prerender = true;

export const GET: APIRoute = async () => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const topics = overview.getRestOverviewTopics(await getSDKJSONInSSR("http"));
  const link = (text: string, path: string, anchor?: string) =>
    `[${text}](${base}${path}/index.md${anchor ? `#${anchor}` : ""})`;

  const markdown = [
    `# ${overview.TITLE}`,
    overview.INTRO,
    "## Authentication",
    `${overview.AUTH_INTRO} ${link(overview.AUTH_LINK.text, overview.AUTH_LINK.path, overview.AUTH_LINK.anchor)} ${overview.AUTH_AFTER_LINK}`,
    "```bash\n" + overview.AUTH_EXAMPLE + "\n```",
    `${overview.WALKTHROUGH.before} ${link(overview.WALKTHROUGH.text, overview.WALKTHROUGH.path)}.`,
    "## Base URL",
    "```text\n" + getRestBaseUrl() + "\n```",
    "## Resources",
    topics
      .map((topic) => `- ${link(topic.label, `${REST_REFERENCE_PATH}/${topic.slug}`)}${topic.description ? `: ${topic.description}` : ""}`)
      .join("\n"),
  ].join("\n\n");

  return new Response(markdown + "\n", { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
};
