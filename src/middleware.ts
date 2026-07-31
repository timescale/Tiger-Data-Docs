import { defineMiddleware } from 'astro:middleware';
import { WEBSITE_DOCS } from './constants';

export const onRequest = defineMiddleware((context, next) => {
  try {
    // Set custom logo link to main site instead of docs
    if (context.locals?.starlightRoute) {
      context.locals.starlightRoute.siteTitleHref = WEBSITE_DOCS;
    }
  } catch {
    // Safely handle cases where starlightRoute is not available (e.g., 404 prerender)
  }
  return next();
});
