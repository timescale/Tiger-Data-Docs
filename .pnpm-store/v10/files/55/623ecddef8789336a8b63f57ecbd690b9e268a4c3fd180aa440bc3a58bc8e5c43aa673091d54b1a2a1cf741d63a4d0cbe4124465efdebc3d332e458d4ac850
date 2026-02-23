import type { RedirectConfig } from 'astro';

// astro redirect keys can be strings or objects, if they're strings, 301 is assumed
// this type/function normalizes them to the complete object form
export type NormalizedRedirectConfig = Record<string, { destination: string; status: number }>;

export function normalizeRedirects(redirects: Record<string, RedirectConfig> | null) {
  if (!redirects) {
    return null;
  }

  if (Object.keys(redirects).length === 0) {
    return null;
  }

  const output: NormalizedRedirectConfig = {};
  for (const [source, redirect] of Object.entries(redirects)) {
    let destination: string;
    let status: number;
    if (typeof redirect === 'string') {
      destination = redirect;
      status = 301; // astro default
    } else {
      destination = redirect.destination;
      status = redirect.status;
    }
    output[source] = {
      destination,
      status,
    };
  }
  return output;
}
