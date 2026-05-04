# Statsig Integration

This documents the Statsig integration in Tiger-Data-Docs: what it does, where the code lives, how to use it with metrics, and how to fully remove it when it's time.

## What it does

A client-side Statsig SDK loads on every page and:

1. Identifies the user via Segment's `ajs_anonymous_id` cookie
2. Initializes `StatsigClient` with session replay + web analytics
3. Checks the `new_docs_site_rollout` gate (logs an exposure for metrics)

The gate exposure lets you measure metric lifts (DAU, WAU, stickiness, etc.) for users who land on the new docs site.

## Where the code lives

| What | Where |
|---|---|
| Inline script | `astro.config.ts` — search for `BEGIN STATSIG` |
| Env var | `PUBLIC_STATSIG_CLIENT_KEY` in `.env.local` and Vercel env settings |
| Env var docs | `.env.example` lines 10-12 |
| Statsig gate | `new_docs_site_rollout` (Statsig Console → Feature Gates) |

## Using metrics

The gate has `measureMetricLifts: true` enabled, with these monitoring metrics already configured:

- `dau`, `wau`, `mau_28d` (daily/weekly/monthly active users)
- `new_dau` (new daily active users)
- `l7` (L7 retention)
- `weekly_stickiness`, `monthly_stickiness`

### Adding custom metrics

1. Go to Statsig Console > Metrics
2. Create or select a metric (e.g. page views, search usage)
3. Open the `new_docs_site_rollout` gate in Statsig Console > **Monitoring Metrics** tab
4. Add your metric — it will start tracking lifts for gate-exposed users

### Viewing results

Open the gate in Statsig Console > **Results** tab to see metric lifts between exposed and unexposed populations.

## How to remove (deprecation checklist)

When you're ready to archive the Statsig integration:

### 1. Archive the gate in Statsig Console

- Open the `new_docs_site_rollout` gate in Statsig Console
- Click **Archive** (or disable it first, wait a cycle, then archive)
- Export any metric results you want to keep before archiving

### 2. Remove the inline script from `astro.config.ts`

Delete everything between the `BEGIN STATSIG` and `END STATSIG` markers (inclusive):

```ts
// In astro.config.ts, inside the head[] array, delete this entire block:

        // ──── BEGIN STATSIG ────
        // ...everything in between...
        // ──── END STATSIG ────
```

### 3. Remove the environment variable

- **Vercel**: Project Settings > Environment Variables > delete `PUBLIC_STATSIG_CLIENT_KEY`
- **Local**: Remove the `PUBLIC_STATSIG_CLIENT_KEY` line from `.env.local`

### 4. Clean up `.env.example`

Remove the Statsig section (lines 10-12):

```
# Statsig Client SDK key (safe for browser, used for exposure logging in gradual rollout).
# Get from: Statsig Console → Project Settings → Keys & Environments → Client API Key
# PUBLIC_STATSIG_CLIENT_KEY=client-xxxxx
```

### 5. Delete this file

```
rm README-statsig.md
```

### 6. Verify

- Run `pnpm build` — confirm no references to `PUBLIC_STATSIG_CLIENT_KEY`
- Deploy to preview — confirm no Statsig network requests in browser devtools
- Check the Statsig Console — confirm the gate shows as archived

## History

- **2026-03**: Integration added for gradual rollout of new docs site (Tiger-Data-Docs) replacing legacy Gatsby docs (web-documentation)
- **2026-04**: Domain migration to tigerdata.com/docs completed. Orphaned sticky cookie (`td_new_docs`) removed. Integration kept for session replay, web analytics, and metric tracking.
