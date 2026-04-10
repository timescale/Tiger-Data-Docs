export default function middleware(request: Request) {
  const url = new URL(request.url);

  // Rewrite /docs/<path>.md → /<path>/index.md
  if (url.pathname.endsWith(".md")) {
    const inner = url.pathname.slice("/docs/".length, -".md".length);
    url.pathname = `/${inner}/index.md`;
    return fetch(new Request(url, request));
  }
}

export const config = {
  matcher: "/docs/:path*",
};
