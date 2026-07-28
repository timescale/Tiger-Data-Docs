import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  // Set custom logo link to main site instead of docs
  if (context.locals.starlightRoute) {
    context.locals.starlightRoute.siteTitleHref = 'https://www.tigerdata.com';
  }
  return next();
});
