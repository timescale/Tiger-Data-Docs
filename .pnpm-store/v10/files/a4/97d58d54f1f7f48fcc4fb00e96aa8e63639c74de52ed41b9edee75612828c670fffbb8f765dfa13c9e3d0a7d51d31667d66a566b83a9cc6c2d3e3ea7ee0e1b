import { defineMiddleware } from 'astro:middleware';
import { toMarkdown } from './toMarkdown';
import { API_REFERENCE_BASE_PATH } from 'virtual:stl-docs-virtual-module';
import path from 'path';

// this is only run in `astro dev` for rendering prose content as Markdown on the fly.
export const onRequest = defineMiddleware(async (context, next) => {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (!import.meta.env.DEV) {
    return next();
  }

  const resolvedBasePath = path.posix.join(import.meta.env.BASE_URL ?? '', API_REFERENCE_BASE_PATH);
  if (resolvedBasePath && context.url.pathname.startsWith(resolvedBasePath)) {
    // handled by the API reference API route in stl-starlight plugin
    return next();
  }

  if (!context.url.pathname.endsWith('/index.md')) {
    return next();
  }

  const pathname = context.url.pathname.replace('index.md', '');

  // We must trim the trailing slash to support astro configs with `trailingSlash: 'never'`
  const cleanPathname = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname;
  const htmlUrl = new URL(cleanPathname, context.url);

  const resp = await fetch(htmlUrl);
  if (!resp.ok) {
    return new Response('Failed to fetch HTML', { status: 400 });
  }
  const html = await resp.text();
  const md = await toMarkdown(html);

  if (!md) {
    return new Response('Failed to render Markdown', { status: 400 });
  }

  return new Response(md, { status: 200 });
});
