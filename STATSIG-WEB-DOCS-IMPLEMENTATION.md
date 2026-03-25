# Statsig Implementation Guide: web-documentation (Gatsby)

## Context

This document contains everything needed to add Statsig gradual rollout support to the `timescale/web-documentation` repository (the old Gatsby docs site at `tigerdata.com/docs`).

**Goal:** Gradually route users from the old docs site (web-documentation/Gatsby) to the new docs site (Tiger-Data-Docs/Astro) using a Statsig feature gate called `new_docs_site_rollout`. The rollout follows a 2% → 10% → 50% → 100% cadence, controlled entirely from the Statsig console (no code deploys needed to change percentages).

**How it works:**
1. User visits `tigerdata.com/docs/some-page`
2. Vercel Edge Middleware runs before the page is served
3. Middleware reads the `ajs_anonymous_id` cookie (set by Segment, shared across both sites)
4. Middleware evaluates the Statsig gate `new_docs_site_rollout` for that user
5. If user is in treatment group → 302 redirect to equivalent page on the new site
6. If user is NOT in treatment group → serve old site normally
7. If user already has `td_new_docs=1` cookie → redirect to new site (sticky bucketing, skip gate evaluation)

**Important:** The new site (Tiger-Data-Docs) already sets the `td_new_docs=1` sticky cookie on `.tigerdata.com` when a user lands there. This ensures users don't bounce between sites.

---

## Prerequisites

- Statsig account with a project set up
- Feature gate `new_docs_site_rollout` created in the Statsig console
  - Rule: Partial rollout on `userID`
  - Starting percentage: 2%
- **Statsig Server Secret Key** (from Statsig Console → Project Settings → Keys & Environments → Server Secret Key)
- **Statsig Client SDK Key** already configured in Tiger-Data-Docs: `client-iO4zZoMHaWtIrvRXHtAZKmDx9XjQQQAgOBN4sdWzwQD`

---

## Existing Architecture (Important Context)

### Files you need to know about

| File | Purpose |
|------|---------|
| `middleware.js` | **Already exists.** Vercel Edge Middleware for Profound Analytics logging. Statsig logic must be added here (not a new file). |
| `gatsby-ssr.js` | Injects Segment analytics script (same write key `CF77jkjlE82B4PhIHbbMDiSmOJsDYMqF` as Tiger-Data-Docs). This is where `ajs_anonymous_id` gets set. |
| `gatsby-config.js` | GTM (`GTM-PFLX3HP`), Osano, Sentry config. No changes needed. |
| `env.js` | Browser-safe env vars via `collectEnvVariables()`. Not needed for edge middleware. |
| `env.node.js` | Node-only env config. Not needed for edge middleware. |
| `.env.example` | Currently has `GATSBY_HOCKEY_STACK_API_KEY` and `PROFOUND_API_KEY`. |
| `vercel.json` | Build config, CSP headers, rewrites. Needs CSP update for Statsig. |

### Current middleware.js structure

The existing `middleware.js` exports:
- A `config` object with a `matcher` that excludes static assets
- A default `middleware(request)` function that logs to Profound Analytics
- It returns `undefined` to continue to origin

**Your Statsig logic must integrate INTO this existing middleware**, not replace it.

---

## Changes Required

### 1. Install Statsig dependency

```bash
yarn add @statsig/vercel-edge
```

### 2. Add environment variables

**In `.env.example`**, add:
```
# Statsig - Server secret key for edge middleware gate evaluation
# Get from: Statsig Console → Project Settings → Keys & Environments → Server Secret Key
STATSIG_SERVER_SECRET_KEY='secret-xxxx'
```

**In Vercel project settings** (tigerdata.com/docs deployment):
- Add `STATSIG_SERVER_SECRET_KEY` with the actual secret key value
- This is server-side only, never exposed to the browser

### 3. Update `middleware.js`

Replace the entire file with the code below. This preserves the existing Profound Analytics logging and adds Statsig gate evaluation before it.

```js
/**
 * Vercel Edge Middleware
 *
 * 1. Statsig: Gradual rollout of new docs site (Tiger-Data-Docs)
 * 2. Profound Analytics: Request logging (pre-existing)
 *
 * The Statsig gate "new_docs_site_rollout" controls what percentage of users
 * get redirected to the new docs site. Percentages are managed in the Statsig
 * console — no code deploys needed to change the rollout stage.
 */

import { statsig } from '@statsig/vercel-edge';

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js)).*)',
  ],
};

// ─── Statsig Configuration ─────────────────────────────────────────────────

const STATSIG_GATE = 'new_docs_site_rollout';
const NEW_DOCS_BASE_URL = 'https://www.tigerdata.com'; // Tiger-Data-Docs base URL
const STICKY_COOKIE_NAME = 'td_new_docs';
const STICKY_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Map old docs paths to new docs paths.
 *
 * Add entries as pages become available on the new site.
 * Paths NOT in this map will never redirect (the old site serves them).
 *
 * Format: '/docs/old-path' → '/new-path'
 *
 * TODO: Populate this with actual path mappings as the new site content grows.
 * You can also change this to a more sophisticated mapping strategy (regex, etc.)
 */
const PATH_MAP = {
  // Examples — replace with real mappings:
  // '/docs/getting-started': '/get-started',
  // '/docs/getting-started/services': '/get-started/services',
};

/**
 * Convert an old docs path to the equivalent new site path.
 * Returns null if the page doesn't exist on the new site yet.
 */
function getNewSitePath(oldPath) {
  // Strip trailing slash for consistent matching
  const normalized = oldPath.replace(/\/$/, '') || '/docs';

  // Check exact match
  if (PATH_MAP[normalized]) {
    return PATH_MAP[normalized];
  }

  // If PATH_MAP is empty (or you want a blanket redirect during later rollout
  // stages), uncomment the line below to redirect ALL paths as-is:
  // return oldPath.replace(/^\/docs/, '') || '/';

  return null;
}

// ─── Profound Analytics (pre-existing) ──────────────────────────────────────

const PROFOUND_API_ENDPOINT = 'https://artemis.api.tryprofound.com/v1/logs/custom';

async function sendLogsToProfound(logs, apiKey) {
  if (!apiKey || logs.length === 0) return;
  try {
    await fetch(PROFOUND_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(logs),
    });
  } catch (error) {
    console.error('Profound logging error:', error.message);
  }
}

function getClientIP(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '0.0.0.0';
}

function getQueryParams(url) {
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return Object.keys(params).length > 0 ? params : undefined;
}

// ─── Cookie Helpers ─────────────────────────────────────────────────────────

function getCookie(request, name) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function generateUUID() {
  // Simple UUID v4 generator for edge runtime
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Main Middleware ────────────────────────────────────────────────────────

export default async function middleware(request) {
  const url = new URL(request.url);

  // ── Statsig: Check if user should be redirected to new docs site ──

  const statsigKey = process.env.STATSIG_SERVER_SECRET_KEY;

  if (statsigKey) {
    try {
      // 1. Check sticky cookie first (already bucketed to new site)
      const stickyCookie = getCookie(request, STICKY_COOKIE_NAME);
      if (stickyCookie === '1') {
        const newPath = getNewSitePath(url.pathname);
        if (newPath) {
          const redirectUrl = `${NEW_DOCS_BASE_URL}${newPath}${url.search}`;
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl },
          });
        }
      }

      // 2. Get user ID from Segment's ajs_anonymous_id cookie, or generate one
      let userId = getCookie(request, 'ajs_anonymous_id');
      const headers = new Headers();

      if (!userId) {
        // First-time visitor before Segment loads — generate a stable ID
        userId = generateUUID();
        headers.append(
          'Set-Cookie',
          `ajs_anonymous_id=${encodeURIComponent(userId)}; Domain=.tigerdata.com; Path=/; Max-Age=${STICKY_COOKIE_MAX_AGE}; SameSite=Lax`
        );
      }

      // 3. Evaluate the Statsig feature gate
      await statsig.initialize(statsigKey);
      const passes = statsig.checkGate({ userID: userId }, STATSIG_GATE);

      if (passes) {
        const newPath = getNewSitePath(url.pathname);
        if (newPath) {
          // Set sticky cookie so user stays on new site
          headers.append(
            'Set-Cookie',
            `${STICKY_COOKIE_NAME}=1; Domain=.tigerdata.com; Path=/; Max-Age=${STICKY_COOKIE_MAX_AGE}; SameSite=Lax`
          );

          const redirectUrl = `${NEW_DOCS_BASE_URL}${newPath}${url.search}`;
          headers.set('Location', redirectUrl);
          return new Response(null, { status: 302, headers });
        }
      }
    } catch (err) {
      // Fail closed: if Statsig errors, serve the old site normally
      console.error('Statsig middleware error:', err.message);
    }
  }

  // ── Profound Analytics logging (pre-existing, unchanged) ──

  const profoundApiKey = process.env.PROFOUND_API_KEY;

  if (profoundApiKey) {
    const startTime = Date.now();
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: request.method,
      host: url.hostname,
      path: url.pathname,
      status_code: 200,
      ip: getClientIP(request),
      user_agent: request.headers.get('user-agent') || '',
      query_params: getQueryParams(url),
      referer: request.headers.get('referer') || undefined,
      duration_ms: Date.now() - startTime,
    };

    Object.keys(logEntry).forEach((key) => {
      if (logEntry[key] === undefined) {
        delete logEntry[key];
      }
    });

    sendLogsToProfound([logEntry], profoundApiKey);
  }

  // Continue to origin (serve old site)
  return;
}
```

### 4. Update CSP headers in `vercel.json`

In the `Content-Security-Policy` header value, add these domains:

**To `script-src`:**
```
https://cdn.jsdelivr.net
```
(Already present — no change needed for script-src)

**To `connect-src`** (add this directive if it doesn't exist, or append to it):
```
https://api.statsig.com https://featureassets.org https://featuregates.org
```

The CSP header is a single long string in `vercel.json`. Find the `Content-Security-Policy` header and add `connect-src 'self' https://api.statsig.com https://featureassets.org https://featuregates.org;` to it. (If `connect-src` already exists, just append the Statsig domains.)

### 5. Update `.env.example`

Add:
```
# Statsig - Server secret key for gradual docs rollout edge middleware
STATSIG_SERVER_SECRET_KEY='secret-xxxx'
```

---

## Path Mapping (Critical)

The `PATH_MAP` object in `middleware.js` controls which pages are eligible for redirect. **Only pages that exist on both sites should be in this map.** This prevents users from being redirected to a 404 on the new site.

### How to populate it

1. Get list of all pages on the new site (Tiger-Data-Docs):
   ```bash
   # In the Tiger-Data-Docs repo:
   find dist -name 'index.html' | sed 's|dist||;s|/index.html||' | sort
   ```

2. Map each old path to its new equivalent. Example:
   ```js
   const PATH_MAP = {
     '/docs/getting-started': '/get-started',
     '/docs/getting-started/services': '/get-started/services',
     '/docs/tutorials': '/build',
     // ... etc
   };
   ```

3. Pages NOT in the map will always serve from the old site — this is safe.

### Blanket redirect option

Once the new site has full content parity, you can skip the path map entirely by uncommenting this line in `getNewSitePath()`:

```js
return oldPath.replace(/^\/docs/, '') || '/';
```

This redirects ALL old paths to the new site by stripping the `/docs` prefix.

---

## Testing

### Local testing

1. Set `STATSIG_SERVER_SECRET_KEY` in `.env`
2. Run `vercel dev` (requires Vercel CLI) — this runs the edge middleware locally
3. Open `localhost:3000/docs/` — should serve old site (you won't be in the 2% rollout locally)
4. Temporarily set the gate to 100% in Statsig console → refresh → should redirect

### Staging verification

1. Deploy to a Vercel preview branch
2. Set gate to 100% in Statsig staging environment
3. Visit old site URL → confirm 302 redirect to new site
4. Check browser cookies for `td_new_docs=1` on `.tigerdata.com`
5. Clear cookies → visit again → confirm redirect still happens (gate at 100%)
6. Set gate to 0% → clear cookies → confirm no redirect

### Production rollout

1. Set gate to 2% in production environment
2. Monitor in Statsig console for exposure events
3. Check Segment for page view anomalies
4. Watch for 404s on the new site (indicates path mapping issues)
5. Advance through 10% → 50% → 100% as confidence builds (all in Statsig console, no deploys)

---

## Post-Rollout Cleanup (After 100%)

Once the new site is fully live:

1. Remove Statsig from `middleware.js` (keep Profound Analytics logging)
2. Remove `@statsig/vercel-edge` from `package.json`
3. Remove `STATSIG_SERVER_SECRET_KEY` from Vercel env vars
4. Convert the middleware to simple 301 redirects (permanent) from old paths to new paths
5. Archive the `new_docs_site_rollout` gate in Statsig console
6. Remove Statsig client SDK from Tiger-Data-Docs `astro.config.ts`
7. Remove `td_new_docs` cookie logic from Tiger-Data-Docs

---

## Reference: Shared Infrastructure

Both sites share these identifiers (do not change):

| What | Value |
|------|-------|
| Segment Write Key | `CF77jkjlE82B4PhIHbbMDiSmOJsDYMqF` |
| GTM Container | `GTM-PFLX3HP` |
| Cookie Domain | `.tigerdata.com` |
| Sticky Cookie Name | `td_new_docs` |
| Statsig Gate Name | `new_docs_site_rollout` |
| Statsig Client Key | `client-iO4zZoMHaWtIrvRXHtAZKmDx9XjQQQAgOBN4sdWzwQD` |
