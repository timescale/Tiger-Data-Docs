/**
 * Technology labels for the /integrate overview "Technology" filter and card `data-technologies`.
 * Keep in sync with `integrationTechnologies` in `src/content.config.ts` (z.enum).
 */
export const INTEGRATION_TECHNOLOGY_KEYS = [
  "PostgreSQL",
  "Python",
  "SQL",
  "Kafka",
  "AWS",
  "Azure",
  "GCP",
  "Terraform",
  "Kubernetes",
  "Grafana",
  "Prometheus",
  "REST API"
] as const;

export type IntegrationTechnologyKey = (typeof INTEGRATION_TECHNOLOGY_KEYS)[number];

/** Substring patterns matched against lowercased `keywords` when `integrationTechnologies` is unset. */
export const TECHNOLOGY_KEYWORD_PATTERNS: Record<
  IntegrationTechnologyKey,
  readonly string[]
> = {
  PostgreSQL: [
    "postgres",
    "psql",
    "pgadmin",
    "fdw",
    "foreign data wrappers",
    "postgresql"
  ],
  Python: ["python", "psycopg2", "sdk"],
  SQL: ["sql editor", "sql shell", "query tool", "interactive queries"],
  Kafka: ["kafka", "confluent", "event streaming"],
  AWS: ["aws", "lambda", "sagemaker", "cloudwatch", "s3"],
  Azure: ["azure"],
  GCP: ["google cloud", "gcp"],
  Terraform: ["terraform", "iac", "infrastructure as code"],
  Kubernetes: ["kubernetes", "k8s", "container orchestration"],
  Grafana: ["grafana"],
  Prometheus: ["prometheus"],
  "REST API": ["api integration", "rest"]
};

export function technologiesFromKeywords(
  keywords: string[] | undefined
): IntegrationTechnologyKey[] {
  const kw = (keywords ?? []).map((k) => k.toLowerCase());
  const techs: IntegrationTechnologyKey[] = [];
  for (const tech of INTEGRATION_TECHNOLOGY_KEYS) {
    const patterns = TECHNOLOGY_KEYWORD_PATTERNS[tech];
    if (patterns.some((p) => kw.some((k) => k.includes(p)))) {
      techs.push(tech);
    }
  }
  return techs;
}

/** Prefer explicit frontmatter; otherwise infer from keywords. */
export function resolveIntegrationTechnologies(
  explicit: IntegrationTechnologyKey[] | undefined,
  keywords: string[] | undefined
): IntegrationTechnologyKey[] {
  if (explicit?.length) {
    return [...new Set(explicit)];
  }
  return technologiesFromKeywords(keywords);
}
