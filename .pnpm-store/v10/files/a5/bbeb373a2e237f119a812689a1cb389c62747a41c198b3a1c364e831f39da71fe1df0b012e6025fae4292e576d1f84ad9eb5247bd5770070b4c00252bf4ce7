import { AstroIntegrationLogger } from 'astro';

let sharedLogger: AstroIntegrationLogger | null = null;

// This is probably temporary, but it's a quick way to share a logger between our many integrations
// we want to share a logger so they have the same "stainless" label

export function setSharedLogger(logger: AstroIntegrationLogger) {
  sharedLogger = logger;
}

// a fallback is probably not required, but it's a good safeguard in case we somehow call a logger before the shared logger is set
export function getSharedLogger({ fallback }: { fallback: AstroIntegrationLogger }) {
  return sharedLogger ?? fallback;
}
