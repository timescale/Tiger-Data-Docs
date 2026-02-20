import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { HTMLElement, parse } from 'node-html-parser';

type PaginationLink = {
  href: string;
  label: string;
};

type PaginationItems = {
  prev: PaginationLink | null;
  next: PaginationLink | null;
};

function parsePaginationLink(footer: HTMLElement, rel: 'next' | 'prev'): PaginationLink | null {
  const link = footer.querySelector(`.pagination-links a[rel="${rel}"]`);
  if (!link) {
    return null;
  }

  const title = link.querySelector('.link-title');
  if (!title) {
    return null;
  }

  const href = link.getAttribute('href');
  if (!href) {
    return null;
  }

  return {
    href,
    label: title.text,
  };
}

function isRelativeLink(href: string) {
  return href.startsWith('/');
}

function hasExtension(href: string) {
  return href.includes('.');
}

function removeTrailingSlash(href: string) {
  return href.replace(/\/$/, '');
}

function makeMarkdownLinks(el: HTMLElement) {
  el.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) {
      return a;
    }

    if (isRelativeLink(href) && !hasExtension(href)) {
      if (href === '/') {
        a.setAttribute('href', '/index.md');
      } else {
        a.setAttribute('href', `${removeTrailingSlash(href)}/index.md`);
      }
    }
    return a;
  });
}

function removeHiddenElements(el: HTMLElement) {
  const hiddenSelectors = ['.sl-anchor-link'];
  for (const selector of hiddenSelectors) {
    const hiddenElements = el.querySelectorAll(selector);
    for (const hiddenElement of hiddenElements) {
      hiddenElement.remove();
    }
  }
}

export async function toMarkdown(html: string) {
  const root = parse(html);

  const mainEl = root.querySelector('main');

  if (!mainEl) {
    return null;
  }

  makeMarkdownLinks(mainEl);

  const footer = mainEl.querySelector('footer');

  const markdownContentEl = mainEl.querySelector('.sl-markdown-content');
  if (!markdownContentEl) {
    return null;
  }

  removeHiddenElements(markdownContentEl);

  const articleContent = markdownContentEl.innerHTML;

  const paginationLinks: PaginationItems = {
    prev: null,
    next: null,
  };

  if (footer) {
    paginationLinks.prev = parsePaginationLink(footer, 'prev');
    paginationLinks.next = parsePaginationLink(footer, 'next');
  }

  let md = (
    await unified()
      .use(rehypeParse, { fragment: true }) // parse HTML
      .use(rehypeRemark) // rehype (HTML) -> remark (MD AST)
      .use(remarkGfm) // tables, strikethrough, autolinks, etc.
      .use(remarkStringify, {
        fences: true,
        bullet: '-',
        listItemIndent: 'one',
        rule: '-',
      })
      .process(articleContent)
  ).toString();

  const title = root.querySelector('title')?.textContent;
  const description = root.querySelector('meta[name="description"]')?.attributes.content;
  const lastUpdated = root.querySelector('.meta time')?.attributes.datetime;

  // let htmlUrl = url.toString().replace('.md', '');
  // if (htmlUrl.endsWith('/index')) {
  //   htmlUrl = htmlUrl.replace('/index', '');
  // }

  md = [
    '---',
    `title: ${title}`,
    description ? `description: ${description}` : [],
    lastUpdated ? `lastUpdated: ${lastUpdated}` : [],
    // `source_url:`,
    // `  html: ${htmlUrl}`,
    // `  md: ${url.toString()}`,
    '---\n',
    md,
  ]
    .flat()
    .join('\n');

  if (paginationLinks.prev) {
    md += `\n\n[Previous](${paginationLinks.prev.href})`;
  }

  if (paginationLinks.next) {
    md += `\n\n[Next](${paginationLinks.next.href})`;
  }

  return md;
}
