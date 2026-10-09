import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { SitemapItem } from "@astrojs/sitemap";

/**
 * Map a URL path to its potential source file in src/content/docs/
 * Examples:
 *   /learn/something -> src/content/docs/learn/something.mdx
 *   /get-started -> src/content/docs/get-started/index.mdx or src/content/docs/get-started.mdx
 *   / -> src/content/docs/index.mdx
 */
function mapUrlToSourceFile(pathname: string): string[] {
  const basePath = resolve("src/content/docs");

  // Remove leading/trailing slashes
  const cleaned = pathname.replace(/^\/|\/$/g, "");

  if (!cleaned) {
    // Root page
    return [join(basePath, "index.mdx")];
  }

  const possibilities: string[] = [];

  // Try both .mdx file and directory/index.mdx
  const filePath = join(basePath, `${cleaned}.mdx`);
  const indexPath = join(basePath, cleaned, "index.mdx");

  possibilities.push(filePath, indexPath);

  return possibilities;
}

/**
 * Get the modification time of a file
 */
async function getFileModTime(filePath: string): Promise<Date | null> {
  try {
    const stats = await stat(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}

/**
 * Find the first existing file from a list of possibilities and get its modification time
 */
async function findAndGetLastmod(possibilities: string[]): Promise<Date | null> {
  for (const filePath of possibilities) {
    const modTime = await getFileModTime(filePath);
    if (modTime) {
      return modTime;
    }
  }
  return null;
}

/**
 * Create a serialize function for @astrojs/sitemap that adds lastmod dates
 */
export function createSitemapSerializer() {
  return async (item: SitemapItem): Promise<SitemapItem | undefined> => {
    try {
      const possibilities = mapUrlToSourceFile(item.url);
      const lastmodDate = await findAndGetLastmod(possibilities);

      if (lastmodDate) {
        return {
          ...item,
          lastmod: lastmodDate.toISOString(),
        };
      }
    } catch (error) {
      console.warn(`Failed to get lastmod for ${item.url}:`, error);
    }

    return item;
  };
}