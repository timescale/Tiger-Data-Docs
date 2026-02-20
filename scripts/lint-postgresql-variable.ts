#!/usr/bin/env npx tsx
/**
 * Lint docs for use of the PostgreSQL/Postgres variable (C.PG or C.POSTGRESQL).
 *
 * All references to the database product in prose and headings should use the
 * constant from @constants (e.g. {C.PG}) so the display name can be changed in
 * one place. Literal "PostgreSQL" or "Postgres" in content or headings will
 * fail this check.
 *
 * Exceptions (literal is allowed):
 * - Inside URLs (e.g. https://postgresql.org/...) or URL-like paths
 * - Inside backticks (UI elements, code, file paths, command names)
 *
 * Usage:
 *   pnpm run lint:postgresql-variable   # Check (CI)
 *
 * Exits 0 if all content uses the variable (or is allowlisted/excepted), 1 otherwise.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");

/** Phrases that refer to something other than the database product (e.g. demo names). */
const ALLOWLIST_PHRASES = [
  "Postgres Air",
  "postgresql.org",
  "postgresql.org/",
  "wiki.postgresql.org",
];

/**
 * Patterns for lines we skip (code, paths, class names, connection strings).
 * If the line matches any of these, we don't flag it.
 */
const SKIP_LINE_PATTERNS = [
  /postgres:\/\//i,
  /C:\\Program Files\\PostgreSQL/i,
  /io\.debezium\.connector\.postgresql/i,
  /PostgresConnector|PostgresSchema|PostgresStreaming|PostgresConnection|PostgresReplication/i,
  /debezium\.connector\.postgresql/i,
];

interface Violation {
  file: string;
  line: number;
  content: string;
}

function isInAllowlist(line: string): boolean {
  const trimmed = line.trim();
  for (const phrase of ALLOWLIST_PHRASES) {
    if (trimmed.includes(phrase)) return true;
  }
  return false;
}

function matchesSkipPattern(line: string): boolean {
  return SKIP_LINE_PATTERNS.some((re) => re.test(line));
}

/** Check if line already uses the variable. */
function usesVariable(line: string): boolean {
  return /\{C\.(PG|POSTGRESQL)\}/.test(line);
}

/** Check if we're in a fenced code block (```). */
function toggleCodeBlock(line: string, inCodeBlock: boolean): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith("```")) return !inCodeBlock;
  return inCodeBlock;
}

/** Regex for literal "PostgreSQL" or "Postgres" (word boundary). */
const LITERAL_REGEX = /\b(PostgreSQL|Postgres)\b/g;

/** Check if line contains literal "PostgreSQL" or "Postgres" (word boundary). */
function hasLiteral(line: string): boolean {
  LITERAL_REGEX.lastIndex = 0;
  return LITERAL_REGEX.test(line);
}

/**
 * Return start indices of backtick-delimited spans (odd indices = inside backticks).
 * e.g. "See `PostgreSQL` and connect" -> backtick positions, so "PostgreSQL" is in [start, end) of an odd segment.
 */
function backtickSpans(line: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let start = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === "`") {
      spans.push([start, i]);
      start = i + 1;
    }
  }
  if (start <= line.length) spans.push([start, line.length]);
  return spans;
}

/** True if position is inside an odd-indexed backtick span (i.e. inside backticks). */
function isInsideBackticks(position: number, spans: Array<[number, number]>): boolean {
  for (let i = 1; i < spans.length; i += 2) {
    const [s, e] = spans[i];
    if (position >= s && position < e) return true;
  }
  return false;
}

/** URL or path pattern: http(s)://, Unix path, or Windows path containing postgres. */
const URL_OR_PATH_REGEX =
  /https?:\/\/[^\s`]+|\/[\w./-]*(?:[Pp]ostgres(?:ql)?)[\w./-]*|(?:[A-Za-z]:)?\\[^\\s`]*(?:[Pp]ostgres(?:ql)?)[^\\s`]*/gi;

/** True if the substring [start, end) of line is part of a URL or path. */
function isInsideUrlOrPath(line: string, start: number, end: number): boolean {
  URL_OR_PATH_REGEX.lastIndex = 0;
  const matches = line.matchAll(URL_OR_PATH_REGEX);
  for (const m of matches) {
    const mStart = m.index ?? 0;
    const mEnd = mStart + (m[0].length ?? 0);
    if (start >= mStart && end <= mEnd) return true;
  }
  return false;
}

/**
 * Whether the line has a violation: it contains a literal that is NOT only inside
 * backticks and NOT inside a URL/path.
 */
function hasUnallowedLiteral(line: string): boolean {
  const spans = backtickSpans(line);
  LITERAL_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = LITERAL_REGEX.exec(line)) !== null) {
    const start = m.index;
    const end = start + (m[0].length ?? 0);
    if (isInsideBackticks(start, spans)) continue;
    if (isInsideUrlOrPath(line, start, end)) continue;
    return true; // this occurrence is in prose/heading and not allowed
  }
  return false;
}

function lintFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];
  const relPath = path.relative(ROOT_DIR, filePath);
  let inCodeBlock = false;
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "---") inFrontmatter = !inFrontmatter;
    if (inFrontmatter) continue;

    inCodeBlock = toggleCodeBlock(line, inCodeBlock);

    if (inCodeBlock) continue;
    if (!hasLiteral(line)) continue;
    if (usesVariable(line)) continue;
    if (isInAllowlist(line)) continue;
    if (matchesSkipPattern(line)) continue;
    if (!hasUnallowedLiteral(line)) continue; // literal only in backticks or URL/path

    violations.push({
      file: relPath,
      line: i + 1,
      content: line.trim().slice(0, 100) + (line.length > 100 ? "…" : ""),
    });
  }

  return violations;
}

async function main(): Promise<void> {
  const contentFiles = await glob("**/*.{md,mdx}", {
    cwd: path.join(ROOT_DIR, "src/content"),
    absolute: true,
  });
  const partialFiles = await glob("**/*.{md,mdx}", {
    cwd: path.join(ROOT_DIR, "src/partials"),
    absolute: true,
  });
  const files = [...contentFiles, ...partialFiles];

  const allViolations: Violation[] = [];
  for (const file of files) {
    const v = lintFile(file);
    allViolations.push(...v);
  }

  if (allViolations.length === 0) {
    console.log("✓ All PostgreSQL/Postgres references use the variable (C.PG or C.POSTGRESQL).");
    process.exit(0);
  }

  console.error("PostgreSQL variable lint: use {C.PG} or {C.POSTGRESQL} instead of literal \"PostgreSQL\" or \"Postgres\".\n");
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.content}\n`);
  }
  console.error(`${allViolations.length} violation(s). Add \`import * as C from "@constants";\` and use \`{C.PG}\` in prose and headings (literal is OK in URLs and in backticks).`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
