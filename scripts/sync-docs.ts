#!/usr/bin/env npx tsx
/**
 * Documentation Sync Script
 *
 * Syncs markdown documentation from source repos (timescaledb, pgai, pgvectorscale)
 * into the Tiger Data Astro documentation site.
 *
 * Usage:
 *   pnpm run sync          # Run once
 *   pnpm run sync --watch  # Watch for changes
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";
import matter from "gray-matter";

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const ROOT_DIR = path.resolve(__dirname, "..");
const TIGER_DATA_ROOT = path.resolve(ROOT_DIR, "..");
const DOCS_DEST = path.join(ROOT_DIR, "src/content/docs");
const PUBLIC_ASSETS = path.join(ROOT_DIR, "public/assets");

interface DocSource {
  name: string;
  sourcePath: string;
  destDir: string;
  files?: string[]; // Specific files to include (for root-level md files)
  globPattern?: string; // Glob pattern for directories
  indexTitle: string;
  indexDescription: string;
}

const DOC_SOURCES: DocSource[] = [
  {
    name: "timescaledb",
    sourcePath: path.join(TIGER_DATA_ROOT, "timescaledb/docs"),
    destDir: "timescaledb",
    globPattern: "**/*.md",
    indexTitle: "TimescaleDB",
    indexDescription:
      "TimescaleDB is an open-source PostgreSQL extension for time-series data, real-time analytics, and scalable database performance.",
  },
  {
    name: "pgai",
    sourcePath: path.join(TIGER_DATA_ROOT, "pgai/docs"),
    destDir: "pgai",
    globPattern: "**/*.md",
    indexTitle: "pgai",
    indexDescription:
      "pgai brings AI workflows to PostgreSQL with vectorizers, semantic catalog, and integrations with popular embedding providers.",
  },
  {
    name: "pgai-extension",
    sourcePath: path.join(TIGER_DATA_ROOT, "pgai/projects/extension/docs"),
    destDir: "pgai/extension",
    globPattern: "**/*.md",
    indexTitle: "pgai Extension",
    indexDescription:
      "The pgai PostgreSQL extension provides SQL functions for calling AI models directly from your database.",
  },
  {
    name: "pgvectorscale",
    sourcePath: TIGER_DATA_ROOT + "/pgvectorscale",
    destDir: "pgvectorscale",
    files: ["README.md", "DEVELOPMENT.md", "CONTRIBUTING.md", "TESTING.md"],
    indexTitle: "pgvectorscale",
    indexDescription:
      "pgvectorscale builds on pgvector with higher performance embedding search and cost-efficient storage for AI applications.",
  },
];

// Component mappings for Mintlify -> Stainless conversions
const COMPONENT_MAPPINGS: [RegExp, string][] = [
  // Note/Warning/Info callouts
  [/<Note>([\s\S]*?)<\/Note>/g, '<Callout variant="note">$1</Callout>'],
  [/<Warning>([\s\S]*?)<\/Warning>/g, '<Callout variant="warning">$1</Callout>'],
  [/<Info>([\s\S]*?)<\/Info>/g, '<Callout variant="note">$1</Callout>'],
  [/<Tip>([\s\S]*?)<\/Tip>/g, '<Callout variant="tip">$1</Callout>'],

  // Tabs
  [/<Tabs>([\s\S]*?)<\/Tabs>/g, "<Tabs>$1</Tabs>"],
  [/<Tab title="([^"]+)">([\s\S]*?)<\/Tab>/g, '<TabItem label="$1">$2</TabItem>'],

  // Card groups
  [/<CardGroup[^>]*>([\s\S]*?)<\/CardGroup>/g, "<Cards>$1</Cards>"],
  [
    /<Card title="([^"]+)"[^>]*>([\s\S]*?)<\/Card>/g,
    '<Card title="$1">$2</Card>',
  ],
];

/**
 * Extract title from markdown content
 */
function extractTitle(content: string, filename: string): string {
  // Try to get title from first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Fallback to filename
  return filename
    .replace(/\.md$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract description from markdown content
 */
function extractDescription(content: string): string {
  // Skip frontmatter if present
  let body = content;
  if (content.startsWith("---")) {
    const endIndex = content.indexOf("---", 3);
    if (endIndex !== -1) {
      body = content.slice(endIndex + 3).trim();
    }
  }

  // Skip HTML elements at the beginning (common in READMEs)
  body = body.replace(/^(?:<[^>]+>\s*)+/gm, "");

  // Skip the title line
  body = body.replace(/^#\s+.+\n+/, "");

  // Skip badges (markdown image links)
  body = body.replace(/^\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\s*/gm, "");

  // Skip div/align blocks
  body = body.replace(/<div[^>]*>[\s\S]*?<\/div>/gi, "");

  // Get first real paragraph (not starting with special chars or HTML)
  const lines = body.split("\n").filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed &&
      !trimmed.startsWith("<") &&
      !trimmed.startsWith("[!") &&
      !trimmed.startsWith("[![") &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("|") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*")
    );
  });

  if (lines.length > 0) {
    let desc = lines[0]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
      .replace(/<[^>]+>/g, "") // Remove HTML tags
      .replace(/[*_`]/g, "") // Remove formatting
      .trim();

    // Truncate if too long
    if (desc.length > 200) {
      desc = desc.slice(0, 197) + "...";
    }
    return desc;
  }

  return "";
}

/**
 * Transform markdown content for the docs site
 */
function transformContent(
  content: string,
  sourcePath: string,
  destDir: string
): string {
  let transformed = content;

  // Parse existing frontmatter
  const parsed = matter(content);
  let frontmatter = parsed.data || {};
  let body = parsed.content;

  // Extract title if not in frontmatter
  if (!frontmatter.title) {
    frontmatter.title = extractTitle(body, path.basename(sourcePath));
  }

  // Extract description if not in frontmatter
  if (!frontmatter.description) {
    frontmatter.description = extractDescription(body);
  }

  // Transform relative links - remove .md extensions
  body = body.replace(
    /\]\(([^)]+)\.md\)/g,
    (match, link) => {
      // Don't transform external links
      if (link.startsWith("http://") || link.startsWith("https://")) {
        return match;
      }
      return `](${link})`;
    }
  );

  // Transform relative links to docs paths
  body = body.replace(
    /\]\(\/docs\/([^)]+)\)/g,
    (match, link) => {
      // Remove .md extension if present
      const cleanLink = link.replace(/\.md$/, "");
      return `](/${destDir}/${cleanLink})`;
    }
  );

  // Apply component mappings
  for (const [pattern, replacement] of COMPONENT_MAPPINGS) {
    body = body.replace(pattern, replacement);
  }

  // Handle GitHub-style alerts (> [!NOTE], > [!WARNING], etc.)
  body = body.replace(
    /> \[!(NOTE|WARNING|TIP|IMPORTANT|CAUTION)\]\n((?:>.*\n?)*)/g,
    (match, type, content) => {
      const variant =
        type.toLowerCase() === "important" ||
        type.toLowerCase() === "caution"
          ? "warning"
          : type.toLowerCase();
      const cleanContent = content
        .split("\n")
        .map((line: string) => line.replace(/^>\s?/, ""))
        .join("\n")
        .trim();
      return `<Callout variant="${variant}">\n${cleanContent}\n</Callout>\n`;
    }
  );

  // Fix HTML attributes for JSX compatibility (align=center -> align="center")
  body = body.replace(/<(\w+)\s+([^>]*?)>/g, (match, tag, attrs) => {
    // Fix unquoted attributes like align=center
    const fixedAttrs = attrs.replace(
      /(\w+)=([^"\s>][^\s>]*)/g,
      '$1="$2"'
    );
    return `<${tag} ${fixedAttrs}>`;
  });

  // Remove empty <p></p> tags that break MDX
  body = body.replace(/<p>\s*<\/p>/g, "");

  // Convert <br> to self-closing <br /> for JSX compatibility
  body = body.replace(/<br>/g, "<br />");

  // Remove Mermaid CSS garbage (rendered CSS that got scraped)
  body = body.replace(/#mermaid-[^{]+\{[^}]+\}[^\n]*/g, "");

  // Escape comparison operators that look like JSX tags
  // Only escape when clearly version comparisons (word char, optional space, operator, optional space, digit - same line only)
  body = body.replace(/(\w)[ \t]*<[ \t]*(\d)/g, "$1 &lt; $2");
  body = body.replace(/(\w)[ \t]*>[ \t]*(\d)/g, "$1 &gt; $2");
  body = body.replace(/(\w)[ \t]*<=[ \t]*(\d)/g, "$1 &lt;= $2");
  body = body.replace(/(\w)[ \t]*>=[ \t]*(\d)/g, "$1 &gt;= $2");

  // Add component imports if needed
  const imports: string[] = [];
  if (body.includes("<Callout")) {
    imports.push('import { Callout } from "@stainless-api/docs/components";');
  }
  if (body.includes("<Tabs") || body.includes("<TabItem")) {
    imports.push('import { Tabs, TabItem } from "@stainless-api/docs/components";');
  }
  if (body.includes("<Cards") || body.includes("<Card")) {
    imports.push('import { Cards, Card } from "@stainless-api/docs/components";');
  }

  // Add imports after frontmatter
  if (imports.length > 0) {
    body = imports.join("\n") + "\n\n" + body;
  }

  // Rebuild content with frontmatter
  transformed = matter.stringify(body, frontmatter);

  return transformed;
}

/**
 * Generate an index.mdx file for a section
 */
function generateIndexFile(
  source: DocSource,
  files: string[]
): string {
  const links = files
    .filter((f) => !f.endsWith("index.mdx") && !f.endsWith("README.md"))
    .map((f) => {
      const name = path.basename(f, path.extname(f));
      const title = name
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return `- [${title}](./${name})`;
    })
    .join("\n");

  return `---
title: ${source.indexTitle}
description: ${source.indexDescription}
---

${source.indexDescription}

## Documentation

${links}
`;
}

/**
 * Sync a single documentation source
 */
async function syncSource(source: DocSource): Promise<void> {
  console.log(`\nSyncing ${source.name}...`);

  const destDir = path.join(DOCS_DEST, source.destDir);

  // Ensure destination directory exists
  fs.mkdirSync(destDir, { recursive: true });

  let files: string[] = [];

  if (source.files) {
    // Specific files
    files = source.files
      .filter((f) => fs.existsSync(path.join(source.sourcePath, f)))
      .map((f) => path.join(source.sourcePath, f));
  } else if (source.globPattern) {
    // Glob pattern
    files = await glob(source.globPattern, {
      cwd: source.sourcePath,
      absolute: true,
      nodir: true,
    });
  }

  console.log(`  Found ${files.length} files`);

  const processedFiles: string[] = [];

  for (const file of files) {
    const relativePath = path.relative(source.sourcePath, file);
    const filename = path.basename(file);

    // Determine destination filename
    let destFilename = filename;

    // Convert README.md to index.mdx
    if (filename.toLowerCase() === "readme.md") {
      destFilename = "index.mdx";
    } else {
      // Change .md to .mdx
      destFilename = filename.replace(/\.md$/, ".mdx");
    }

    // Preserve directory structure
    const relativeDir = path.dirname(relativePath);
    const destPath =
      relativeDir === "."
        ? path.join(destDir, destFilename)
        : path.join(destDir, relativeDir, destFilename);

    // Ensure subdirectory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    // Read and transform content
    const content = fs.readFileSync(file, "utf-8");
    const transformed = transformContent(content, file, source.destDir);

    // Write transformed content
    fs.writeFileSync(destPath, transformed);
    processedFiles.push(destPath);

    console.log(`  ${relativePath} -> ${path.relative(DOCS_DEST, destPath)}`);
  }

  // Generate index file if none exists
  const indexPath = path.join(destDir, "index.mdx");
  if (!processedFiles.includes(indexPath)) {
    const indexContent = generateIndexFile(source, processedFiles);
    fs.writeFileSync(indexPath, indexContent);
    console.log(`  Generated index.mdx`);
  }
}

/**
 * Copy images from source repos to public assets
 */
async function syncImages(): Promise<void> {
  console.log("\nSyncing images...");

  const imagePatterns = [
    { source: path.join(TIGER_DATA_ROOT, "pgai/docs/**/*.{png,jpg,jpeg,gif,svg}"), dest: "pgai" },
    { source: path.join(TIGER_DATA_ROOT, "timescaledb/docs/**/*.{png,jpg,jpeg,gif,svg}"), dest: "timescaledb" },
    { source: path.join(TIGER_DATA_ROOT, "pgvectorscale/**/*.{png,jpg,jpeg,gif,svg}"), dest: "pgvectorscale" },
  ];

  for (const { source, dest } of imagePatterns) {
    const files = await glob(source);
    const destDir = path.join(PUBLIC_ASSETS, dest);

    for (const file of files) {
      const filename = path.basename(file);
      const destPath = path.join(destDir, filename);

      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(file, destPath);
      console.log(`  ${filename} -> ${path.relative(PUBLIC_ASSETS, destPath)}`);
    }
  }
}

/**
 * Main sync function
 */
async function main(): Promise<void> {
  console.log("Starting documentation sync...");
  console.log(`Source root: ${TIGER_DATA_ROOT}`);
  console.log(`Destination: ${DOCS_DEST}`);

  // Sync each source
  for (const source of DOC_SOURCES) {
    if (!fs.existsSync(source.sourcePath)) {
      console.warn(`\n⚠️  Source not found: ${source.sourcePath}`);
      continue;
    }
    await syncSource(source);
  }

  // Sync images
  await syncImages();

  console.log("\n✅ Documentation sync complete!");
}

// Check for watch flag
const isWatch = process.argv.includes("--watch");

if (isWatch) {
  console.log("Watch mode not yet implemented. Running once.");
}

main().catch((error) => {
  console.error("Error syncing documentation:", error);
  process.exit(1);
});
