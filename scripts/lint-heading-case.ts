#!/usr/bin/env npx tsx
/**
 * Lint headings in docs for sentence case.
 *
 * Sentence case: first letter of the first word capitalized; rest of words
 * lowercase unless they are proper nouns or acronyms (e.g. Tiger Data, API, SQL).
 *
 * Usage:
 *   pnpm run lint:headings          # Check all headings (CI)
 *   pnpm run lint:headings -- --fix # Fix headings to sentence case in place
 *
 * Exits 0 if all headings are sentence case, 1 otherwise.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT_DIR, "src/content");

/** Acronyms and all-caps terms that may stay as-is (case-insensitive check). */
const ACRONYMS = new Set(
  [
    "API", "APIs", "AWS", "AI", "CIDR", "CIDRs", "CLI", "CPU", "CSV", "EV", "GA", "I/O",
    "IOPS", "LLMs", "MCP", "RBAC", "SQL", "TB", "UUID", "UUIDv7", "VPC", "VPCs", "2FA", "HIPAA",
    "PG", "CI", "CD", "ETL", "FDW", "HA", "JSON", "NYC", "UI", "UX", "VM", "IDE", "SaaS", "DBM",
  ].map((s) => s.toLowerCase())
);

/**
 * Proper nouns and product names (mixed case or capitalized) that are allowed
 * to be capitalized in headings. Stored lowercase for case-insensitive match;
 * we only flag words that are capitalized and not in this set.
 */
const PROPER_NOUNS = new Set(
  [
    "Tiger", "TimescaleDB", "Timescale", "Postgres", "PostgreSQL", "Azure", "Console",
    "PopSQL", "Terraform", "Prometheus", "Kafka", "Iceberg", "Anthropic", "Cohere",
    "OpenAI", "Llama", "Gemini", "Voyage", "LiteLLM", "Bedrock", "Vertex",
    "India", "Mumbai", "Zurich", "Europe", "Windows", "Unix", "Fluid", "Ollama",
    "MySQL", "Parquet", "Net", "Python", "JavaScript", "TypeScript", "Go", "Rust",
    "Java", "Ruby", "PHP", "Swift", "Kotlin", "Scala", "Kubernetes", "Docker",
    "Visual", "Studio", "CMake", "GitHub", "Git", "Markdown", "Diátaxis",
    "CloudWatch", "Transit", "Gateway", "Explorer", "Insights", "Notebooks",
    "Livesync", "Vectorizer", "Huggingface", "Chrome", "DevTools",
    "Microsoft", "Google", "Grafana", "Alertmanager", "Looker", "Datadog", "OpenTelemetry", "MacPorts", "Compose", "macOS",
    "Telegraf", "Supabase", "Decodable", "Debezium", "Node", "Apache", "Airflow",
    "Hypercore",
    "SageMaker", "DBeaver", "Fivetran", "Confluent","Ignition",
    "PgBouncer", "Aiven", "GitLab", "Slack", "Outflux", "TimeWeightSummary", "Lambda",
    "HighByte",
  ].map((s) => s.toLowerCase())
);

/** Multi-word proper nouns (phrase) that should be preserved. */
const PROPER_NOUN_PHRASES = [
  "Tiger Data",
  "Tiger Cloud",
  "Tiger Lake",
  "Tiger Console",
  "Tiger MCP",
  "Tiger CLI",
  "Microsoft Azure",
  "Google Vertex",
  "AWS Bedrock",
  "Azure AI",
  "Azure Marketplace",
  "TimescaleDB Toolkit",
  "Datadog Agent",
  "Early Access",
  "Public Beta",
  "Google Cloud",
  "Hugging Face",
  "AWS Lambda",
  "Azure Data Studio",
  "Power BI",
  "Confluent Cloud",
  "Confluent Cloud Schema Registry",
  "Azure Monitor",
  "Metrics and Insights",
  "Timescale Cloud",
  "Azure Private Link",
  "Virtual Private Cloud",
  "AWS Marketplace",
  "VPC Peering",
  "Peering VPC",
  "Aiven Client",
  "Aiven CLI",
  "GitLab authentication",
  "Inductive Automation",
];

/**
 * Pre-computed set of consecutive word pairs from PROPER_NOUN_PHRASES.
 * For a phrase like "Tiger Data", stores "tiger|data".
 * For a phrase like "TimescaleDB Toolkit", stores "timescaledb|toolkit".
 * Used to allow capitalization of the second word in a proper noun phrase.
 */
const PHRASE_PAIRS = new Set<string>();
for (const phrase of PROPER_NOUN_PHRASES) {
  const words = phrase.split(/\s+/);
  for (let i = 1; i < words.length; i++) {
    PHRASE_PAIRS.add(`${words[i - 1].toLowerCase()}|${words[i].toLowerCase()}`);
  }
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/gm;

interface Violation {
  file: string;
  line: number;
  level: string;
  heading: string;
  message: string;
}

/**
 * Check if a single word is allowed to be capitalized (acronym or proper noun).
 */
function allowedCapitalized(word: string): boolean {
  if (!word || word.length === 0) return true;
  const lower = word.toLowerCase();
  const upper = word.toUpperCase();
  // All-caps acronym
  if (word === upper && /[A-Z]/.test(word)) return true;
  if (ACRONYMS.has(lower)) return true;
  if (PROPER_NOUNS.has(lower)) return true;
  // Version-like: v2.24, 2.24, etc.
  if (/^v?\d+(\.\d+)*$/.test(word)) return true;
  // Numbers
  if (/^\d+$/.test(word)) return true;
  return false;
}

/**
 * Check if the heading text is sentence case (allowing proper nouns and acronyms).
 * Returns an error message if not, or null if OK.
 */
function checkSentenceCase(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Skip if the whole heading is a link or special format
  if (trimmed.startsWith("[") || trimmed.startsWith("```")) return null;

  // Skip headings that are code/symbol names (e.g. function names like cohere_classify_simple)
  if (/^[a-z][a-z0-9_]*$/.test(trimmed)) return null;
  // Skip headings that start with a lowercase extension/code identifier (e.g. pgai documentation, pg_textsearch v0.5.0, ai.embedding_openai)
  const firstWord = trimmed.split(/\s+/)[0]?.replace(/[?!.,:;)(\-]+$/, "") ?? "";
  if (firstWord && /^[a-z][a-z0-9_.\-()]*$/.test(firstWord)) return null;

  const words = trimmed.split(/\s+/);
  if (words.length === 0) return null;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Strip trailing punctuation for the check (e.g. "chunks?" -> "chunks")
    const core = word.replace(/[?!.,:;)(\-]+$/, "");
    if (!core) continue;

    const firstChar = core[0];
    const rest = core.slice(1);
    const lower = core.toLowerCase();
    const isCapitalized = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
    const isAllCaps = core === core.toUpperCase() && /[A-Z]/.test(core);

    if (i === 0) {
      // First word: should start with uppercase (or be all-caps), or be a known proper noun like macOS
      if (PROPER_NOUNS.has(lower)) continue;
      if (!isCapitalized && !isAllCaps && /[a-zA-Z]/.test(firstChar)) {
        return `First word should be capitalized: "${word}"`;
      }
      continue;
    }

    // Allow capitalized words that are part of a multi-word proper noun phrase
    if (i > 0) {
      const prevCore = words[i - 1].replace(/[?!.,:;)(\-]+$/, "").replace(/^[(\-]+/, "").toLowerCase();
      if (PHRASE_PAIRS.has(`${prevCore}|${lower}`)) continue;
    }
    if (i < words.length - 1) {
      const nextCore = words[i + 1].replace(/[?!.,:;)(\-]+$/, "").replace(/^[(\-]+/, "").toLowerCase();
      if (PHRASE_PAIRS.has(`${lower}|${nextCore}`)) continue;
    }

    // Subsequent words: should be lowercase unless allowed
    if (isCapitalized && rest !== rest.toUpperCase()) {
      if (allowedCapitalized(core)) continue;
      return `Use sentence case: "${word}" should be "${core.charAt(0).toLowerCase() + rest}" (unless it's a proper noun; add to the allowlist if so)`;
    }
  }

  return null;
}

/** Convert heading to sentence case: first word capitalized, rest lowercase unless allowed. */
function toSentenceCaseSimple(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("[") || trimmed.startsWith("```") || /^[a-z][a-z0-9_]*$/.test(trimmed)) {
    return text;
  }
  const parts = trimmed.split(/\s+/);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const w = parts[i];
    const core = w.replace(/[?!.,:;\-]+$/, "");
    const punct = w.slice(core.length);
    const lower = core.toLowerCase();
    const upper = core.toUpperCase();
    const prev = out.length ? out[out.length - 1].replace(/[?!.,:;\-]+$/, "").toLowerCase() : "";
    const next = i < parts.length - 1 ? parts[i + 1].replace(/[?!.,:;\-]+$/, "").toLowerCase() : "";
    const keepCap =
      i === 0 ||
      (core === upper && /[A-Z]/.test(core)) ||
      allowedCapitalized(core) ||
      PHRASE_PAIRS.has(`${prev}|${lower}`) ||
      PHRASE_PAIRS.has(`${lower}|${next}`);
    const newWord = keepCap ? core : core.charAt(0).toLowerCase() + core.slice(1);
    out.push(newWord + punct);
  }
  return out.join(" ");
}

/**
 * Extract headings from file content and check each.
 */
function lintFile(filePath: string): Violation[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const violations: Violation[] = [];
  let match: RegExpExecArray | null;
  const fullPath = path.relative(ROOT_DIR, filePath);

  HEADING_RE.lastIndex = 0;
  while ((match = HEADING_RE.exec(content)) !== null) {
    const level = match[1];
    const heading = match[2];
    const lineNum = content.slice(0, match.index).split("\n").length;
    const msg = checkSentenceCase(heading);
    if (msg) {
      violations.push({
        file: fullPath,
        line: lineNum,
        level,
        heading,
        message: msg,
      });
    }
  }
  return violations;
}

/**
 * Fix heading case in a file in place.
 */
function fixFile(filePath: string): { fixed: number; replacements: { from: string; to: string }[] } {
  let content = fs.readFileSync(filePath, "utf-8");
  const replacements: { from: string; to: string }[] = [];
  content = content.replace(HEADING_RE, (_, level: string, heading: string) => {
    const fixed = toSentenceCaseSimple(heading);
    if (fixed !== heading) {
      replacements.push({ from: heading, to: fixed });
    }
    return `${level} ${fixed}`;
  });
  if (replacements.length > 0) {
    fs.writeFileSync(filePath, content, "utf-8");
  }
  return { fixed: replacements.length, replacements };
}

async function main(): Promise<void> {
  const fix = process.argv.includes("--fix");
  const files = await glob("**/*.{md,mdx}", {
    cwd: CONTENT_DIR,
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  if (fix) {
    let total = 0;
    for (const file of files) {
      const { fixed, replacements } = fixFile(file);
      if (replacements.length > 0) {
        const rel = path.relative(ROOT_DIR, file);
        console.log(rel);
        for (const r of replacements) {
          console.log(`  - ${r.from}`);
          console.log(`  + ${r.to}`);
        }
        total += fixed;
      }
    }
    console.log(`\nFixed ${total} heading(s) in ${files.length} file(s).`);
    process.exit(0);
  }

  const allViolations: Violation[] = [];
  for (const file of files) {
    const v = lintFile(file);
    allViolations.push(...v);
  }

  if (allViolations.length === 0) {
    console.log("✓ All headings are in sentence case.");
    process.exit(0);
  }

  console.error("Heading case lint (sentence case required):\n");
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.level} ${v.heading}`);
    console.error(`    → ${v.message}\n`);
  }
  console.error(`${allViolations.length} heading(s) need to be updated to sentence case.`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
