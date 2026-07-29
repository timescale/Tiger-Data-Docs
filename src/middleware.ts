import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  try {
    // Set custom logo link to main site instead of docs
    if (context.locals?.starlightRoute) {
      context.locals.starlightRoute.siteTitleHref = 'https://www.tigerdata.com';
    }
  } catch {
    // Safely handle cases where starlightRoute is not available (e.g., 404 prerender)
  }
  return next();
});
