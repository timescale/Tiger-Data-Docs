# Docs Quality Engine Sweep Report

**Scope:** Full corpus (672 pages across all 7 sections)

**Model:** Sonnet 5 (agentic semantic reasoning)

**Methodology:** 8 parallel agents, each running all 14 checklist categories (A–O) on assigned pages, cross-checked against entire 666-page comparison universe. Special focus: C2 numeric divergence vs intentional variation, B1 version claims verified against TimescaleDB release notes, K prose/code agreement, O destructive operations.

## Summary

| Severity | Count |
| --- | --- |
| HIGH | 32 |
| MEDIUM | 26 |
| LOW | 15 |
| **TOTAL** | **73** |

## HIGH Severity (32 findings)

### 1. /build/data-management/hyperfunctions/percentile-approx/approximate-percentile / /reference/toolkit/percentile-approximation/uddsketch/percentile_agg — code-identifiers

**Checklist item:** F3

**Why:** `percentile_agg()` only accepts a `DOUBLE PRECISION` input per its own reference page; calling it on an already-aggregated `UddSketch` value (as this tutorial step does, instead of using `rollup()` as the sibling uddsketch/index.mdx and tdigest/index.mdx overview pages demonstrate for combining multiple buckets) does not match the documented signature and would fail to resolve to any function.

**Evidence:**

```
The tutorial's "Create an alert" step runs `SELECT approx_percentile(0.95, percentile_agg(percentile_agg)) as threshold FROM response_times_daily ...`, applying `percentile_agg()` to a column that already holds a `UddSketch` (from step 1's `percentile_agg(response_time_ms)` CAGG column). The reference page for `percentile_agg()` documents its only signature as `percentile_agg(value DOUBLE PRECISION) RETURNS UddSketch`.
```

**Suggested fix:** Replace `percentile_agg(percentile_agg)` with `rollup(percentile_agg)` in the tutorial's alert-creation query, consistent with how percentile-approximation/uddsketch/index.mdx and tdigest/index.mdx combine multiple buckets before calling an accessor.

**Deferral check:** This flags a call that doesn't match the documented signature on the reference page (F3), which is the engine's job; whether the query literally executes in a live database is the doc testing tool's concern, but the signature mismatch itself is verifiable from the reference page alone.

---

### 2. /build/performance-optimization/improve-hypertable-performance / /reference/timescaledb/hypertables/enable_chunk_skipping — version-availability

**Checklist item:** B1

**Why:** The build guide and the reference page for the exact same function disagree about which TimescaleDB version introduced chunk skipping, and the build page's claim (2.17.1) is verifiably wrong per the actual GitHub release notes; the feature shipped in 2.16.0.

**Evidence:**

```
build page: `<SinceRelease version="2.17.1" product="tsdb" mode="early_access" />` immediately above `## Enable Chunk skipping`, which goes on to describe calling `enable_chunk_skipping()`. reference page for that same function: `<SinceRelease version="2.16.0" product="tsdb" mode="early_access" />`. TimescaleDB's own 2.16.0 release notes: "Add the ability to define chunk skipping indexes on non-partitioning columns of compressed hypertables ... After you call `enable_chunk_skipping` on a column, TimescaleDB tracks the min and max values…" 2.17.1's only related change is "Add chunk skipping GUC" (a smaller, separate addition).
```

**Suggested fix:** Change the `SinceRelease` version on /build/performance-optimization/improve-hypertable-performance from 2.17.1 to 2.16.0 to match the reference page and the changelog.

**Deferral check:** This is a substantive cross-page factual contradiction about product availability, verified against the actual timescale/timescaledb GitHub release notes per B1's specified verification method — not a Vale/build/testing-tool concern.

---

### 3. /build/tips-and-tricks/troubleshoot-import-ingest — procedural-integrity

**Checklist item:** J2

**Why:** Six separate steps in this troubleshooting/migration page promise a specific command, query, or detail via a trailing colon, and none of those commands ever actually appear on the page, so a reader cannot follow the procedure as written.

**Evidence:**

```
"Check the version of {C.TIMESCALE_DB} running on the source database and the target {C.SERVICE_LONG}:" / "Connect to your {C.SERVICE_LONG} and check the versions of {C.TIMESCALE_DB} available:" / "Uninstall {C.TIMESCALE_DB} from your {C.SERVICE_LONG}:" / "Reinstall the correct version of {C.TIMESCALE_DB}:" / "To turn off the jobs: To turn on the jobs:" / "To test your database for partial continuous aggregates, run the following query:" — every one of these lines ends with a colon promising a command or query, and in every case nothing follows anywhere on the page.
```

**Suggested fix:** Restore the missing SQL commands/queries for each dangling colon (they were likely dropped during a content migration/reformat), or remove the colons and rewrite as prose if no command was ever intended.

**Deferral check:** This is about internal logical completeness of the page as written — content that is flatly missing, not whether the steps execute on a live system — and it is not a broken link or compile error.

---

### 4. /deploy/mst/failover / /deploy/mst/about-mst / /deploy/mst/manage-backups — concept-coherence

**Checklist item:** E2

**Why:** The same page uses two different plan-naming schemes for the same concept (service tiers) — 'Pro plan' in the intro, then 'business' and 'premium' plans later — and 'business'/'premium' never appear anywhere else in the current plan-tier vocabulary (about-mst.mdx, manage-backups.mdx), so a reader cannot tell whether their plan is covered by the failover behavior described.

**Evidence:**

```
failover.mdx intro: 'One standby read-only replica server is configured, for each Managed Service for TimescaleDB service on a Pro plan.' Later in the same page, 'Controlled failover during upgrades': 'When applying upgrades or plan changes on business or premium plans, the standby server is replaced... For premium plans, this step is executed for both replica servers before the master server is replaced.' about-mst.mdx and manage-backups.mdx both name the tiers 'Basic', 'Dev', and 'Pro' throughout (e.g. manage-backups.mdx's retention table: 'Dev | 1 day', 'Basic | 2 days', 'Pro | 3 days').
```

**Suggested fix:** Replace 'business or premium plans' and 'premium plans' in failover.mdx with the current tier names ('Pro plan', and clarify whether the two-replica behavior applies to Pro plans specifically), matching the naming already used in about-mst.mdx and manage-backups.mdx.

**Deferral check:** This is a factual naming contradiction within and across pages describing the same product concept, not a prose/style issue Vale would catch.

---

### 5. /deploy/self-hosted/uninstall — drifted-duplicate

**Checklist item:** D1

**Why:** The MacPorts uninstall steps were evidently copy-pasted from the Homebrew tab (which correctly uses `/opt/homebrew/var/postgresql@17/postgresql.conf`) but the path was only partially adapted: MacPorts does not install under `/opt/homebrew` (that is the Homebrew Apple-Silicon prefix), so a MacPorts user following this step will edit a file that does not exist and never actually disable the timescaledb preload library. It also disagrees with the Homebrew tab's PostgreSQL version (postgresql@14 vs postgresql@17), reinforcing that this is stale, unadapted copy.

**Evidence:**

```
MacPorts tab, step 'Remove TimescaleDB from shared_preload_libraries': `nano /opt/homebrew/var/postgresql@14/postgresql.conf` followed a few steps later by `port reload postgresql` (MacPorts command syntax).
```

**Suggested fix:** Replace the MacPorts config-file path with the actual MacPorts PostgreSQL config location (typically under `/opt/local/var/db/postgresqlNN/defaultdb/postgresql.conf`, matching the port-installed PostgreSQL version), and confirm the target PostgreSQL version matches what `port install timescaledb` currently pulls in.

**Deferral check:** This is not a broken link or build error; it is a factual claim about where a file lives on disk, verifiable by inspecting MacPorts' own install layout, so it is in scope for the engine rather than the link checker or build.

---

### 6. /deploy/self-hosted/upgrades/major-upgrade — code-identifiers

**Checklist item:** F1

**Why:** None of `policy_stats`, `continuous_aggregate_stats`, `drop_chunks_policies`, or `reorder_policies` appear anywhere in the current reference/timescaledb/informational-views pages (which only document `policies`, `jobs`, `job_stats`, `job_history`, `job_errors`, `hypertables`, `continuous_aggregates`, `chunks`, `dimensions`, and the columnstore-settings views) or anywhere else in the corpus. These look like leftover TimescaleDB 1.x views from the original 1-to-2 migration guide, presented here as a required step for any current-day major upgrade; a reader on a supported 2.x install will likely hit 'relation does not exist' errors.

**Evidence:**

```
'Export your policy settings' step runs: `COPY (SELECT * FROM timescaledb_information.policy_stats) TO policy_stats.csv csv header`, `COPY (SELECT * FROM timescaledb_information.continuous_aggregate_stats) TO continuous_aggregate_stats.csv csv header`, `COPY (SELECT * FROM timescaledb_information.drop_chunks_policies) TO drop_chunk_policies.csv csv header`, and `COPY (SELECT * FROM timescaledb_information.reorder_policies) TO reorder_policies.csv csv header`.
```

**Suggested fix:** Verify against the current TimescaleDB source/catalog whether these views still exist; if not, replace this step with equivalent queries against `timescaledb_information.policies`/`jobs`/`job_stats`, or scope this step explicitly to legacy TimescaleDB 1.x-to-2.x upgraders only.

**Deferral check:** This flags a suspected-nonexistent identifier for verification against the reference pages (the internal source of truth per the checklist), not a certification that the SQL fails to run — that certification is the doc testing tool's job.

---

### 7. /deploy/tiger-cloud/tiger-cloud-aws/high-availability/high-availability / /deploy/tiger-cloud/tiger-cloud-azure/high-availability/high-availability — concept-coherence

**Checklist item:** E2

**Why:** The page's own comparison table says the basic 'High availability' (1 async replica) strategy is available on all three plans including Performance, but the very next sentence says 'High' and 'Highest' strategies require Scale or Enterprise — directly contradicting its own table and the corpus-wide pricing feature table, which both confirm Performance gets basic HA.

**Evidence:**

```
Table in the HA strategy comparison: "| Tier | Performance, Scale, and Enterprise | Scale and Enterprise | Scale and Enterprise |" (columns are High availability (1 async), High performance (2 async), High data integrity). Immediately below: "The `High` and `Highest` HA strategies are available with the [Scale and the Enterprise] pricing plans." The pricing feature table (`_aws-features.mdx`/`_azure-features.mdx`) lists "HA replicas (Automated multi-AZ failover) | ✓ | ✓ | ✓" for Performance, Scale, and Enterprise alike.
```

**Suggested fix:** Reword the sentence to clarify that only the 'Highest availability' (2-replica) strategies require Scale/Enterprise, while basic 'High availability' (1 async replica) is available on all plans including Performance.

**Deferral check:** This is a self-contradiction within one page's prose and table, cross-confirmed against the pricing feature partial — not a prose-style or build issue.

---

### 8. /deploy/tiger-cloud/tiger-cloud-aws/monitoring / /deploy/tiger-cloud/tiger-cloud-azure/monitoring — cross-page-factual-consistency

**Checklist item:** C1

**Why:** The monitoring page states a 16TB high-performance storage ceiling per service, but two other authoritative pages (the pricing feature comparison and the storage-tiers concept page) state the limit is up to 64TB — a reader would not know which figure to trust when deciding how much data they can store before hitting limits.

**Evidence:**

```
Monitoring page: "The standard high-performance storage gives you 16TB of compressed data on a single server, regardless of the number of hypertables in your Service." The pricing feature table (`_aws-features.mdx`/`_azure-features.mdx`) states "Storage limit per Service | Up to 64 TB" for all plans, and `/learn/data-lifecycle/storage/about-storage-tiers` states high-performance storage "provides you with up to 64 TB of storage".
```

**Suggested fix:** Update the monitoring page's storage limit figure to match the corpus-wide 64TB figure, or clarify what the 16TB number actually refers to (for example a default/unboosted IOPS tier) if it is a genuinely different metric.

**Deferral check:** This is a numeric contradiction between three distinct content pages about the same named limit, not a broken link or style nit.

---

### 9. /deploy/tiger-cloud/tiger-cloud-aws/service-management/service-management / /deploy/tiger-cloud/tiger-cloud-azure/service-management/service-management — destructive-ops

**Checklist item:** O2

**Why:** Deleting a Tiger Cloud service permanently destroys the underlying database and all its data, yet the warning is a plain sentence rather than a Callout, unlike equivalent irreversible-deletion actions elsewhere in the docs (for example self-hosted/uninstall.mdx wraps 'This step permanently deletes all your database data' in a `<Callout variant="warning">`), so the most consequential Console action in the whole corpus gets less visual warning than a self-hosted uninstall step.

**Evidence:**

```
"## Delete a Service\n\nYou can delete a Service to remove it completely. This removes the Service and its underlying data from the server. You cannot recover a deleted Service." — stated as plain prose with no Callout.
```

**Suggested fix:** Wrap the 'Delete a Service' warning in a `<Callout variant="warning">` to match the house convention used for other permanent-data-loss actions in the docs.

**Deferral check:** This is about the doc's presentation of an irreversible action, not whether delete actually works in the live Console — the doc-testing tool owns the latter.

---

### 10. /deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions/pgcrypto / /deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions/pgcrypto — procedural-integrity

**Checklist item:** J1

**Why:** The procedure creates a table called `user_passwords` but the very next step inserts into a different, never-created table `tbl_sym_crypt` — following the steps as written throws 'relation "tbl_sym_crypt" does not exist' and the tutorial breaks before the encrypted data is ever inserted.

**Evidence:**

```
Step 2 ("Create a table named `user_passwords`"): `CREATE TABLE user_passwords (username varchar(100) PRIMARY KEY, crypttext text);` Step 3 ("Insert values..."): `INSERT INTO tbl_sym_crypt (username, crypttext) VALUES (...)`. Step 4 then runs `SELECT * FROM user_passwords;`.
```

**Suggested fix:** Change the INSERT statement's target table from `tbl_sym_crypt` to `user_passwords` to match the table created in the previous step.

**Deferral check:** This is an internal logical break in the procedure as written (undefined object referenced), independent of whether the SQL syntax itself is valid — not something the doc-testing tool's live-Console check or the link validator would catch on this page.

---

### 11. /deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions/pgvector / /deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions/pgvector — code-currency

**Checklist item:** F6

**Why:** The pgvector chatbot tutorial uses the pre-v1 openai-python SDK pattern (module-level `openai.api_key`, `openai.Embedding.create`, `openai.ChatCompletion.create`), which openai-python removed when it released v1.0 in November 2023 — running this code today raises the library's APIRemovedInV1 error. The same docs section's vectorizer-deprecation page shows the correct current `client = openai.OpenAI()` pattern, so the two pages actively disagree on how to call the same API.

**Evidence:**

```
pgvector tutorial: `openai.api_key = os.environ['OPENAI_API_KEY']` ... `response = openai.Embedding.create(model="text-embedding-ada-002", input=...)` and `response = openai.ChatCompletion.create(model="gpt-3.5-turbo-0613", ...)`. Compare the same section's vectorizer-deprecation.mdx: `client = openai.OpenAI()` ... `client.embeddings.create(model="text-embedding-3-small", input=query)`.
```

**Suggested fix:** Rewrite the pgvector tutorial's Python examples to use the current openai-python client interface (`client = openai.OpenAI()`, `client.embeddings.create(...)`, `client.chat.completions.create(...)`), matching the pattern already used in vectorizer-deprecation.mdx.

**Deferral check:** This is a stale/superseded API-call pattern that breaks at runtime for any reader with a current openai-python install, not a TimescaleDB compression-API rename (which is Vale's job) and not something 'does the SQL run' testing would catch since the failure is in the accompanying Python, not the database.

---

### 12. /deploy/tiger-cloud/tiger-cloud-azure/high-availability/backup-restore / /deploy/tiger-cloud/tiger-cloud-aws/high-availability/backup-restore — cross-page-factual-consistency

**Checklist item:** C1

**Why:** The Azure backup-restore page says the Performance plan gets 14-day backup history, but the AWS equivalent page and both clouds' own pricing feature tables say this feature is Scale+Enterprise only, not Performance — a reader on Azure Performance would look for a feature they don't have, or a reader on Azure Scale/Enterprise would think Performance customers also get it.

**Evidence:**

```
Azure page: "On [Scale and Performance](/deploy/tiger-cloud/tiger-cloud-azure/pricing-and-account-management) pricing plans, you can check the list of backups for the previous 14 days..." AWS page (same sentence): "On [Scale and Enterprise](/deploy/tiger-cloud/tiger-cloud-aws/pricing-and-account-management) pricing plans..." The pricing feature tables in both `_aws-features.mdx` and `_azure-features.mdx` list the row "Backup reports" as blank for Performance and "14 days" for Scale and Enterprise only.
```

**Suggested fix:** Change "Scale and Performance" to "Scale and Enterprise" in the Azure backup-restore.mdx sentence to match the AWS page and the pricing feature tables.

**Deferral check:** This is a factual plan-tier mismatch confirmed by comparing two live content pages plus two reference tables, not a broken link or prose-style issue.

---

### 13. /deploy/tiger-cloud/vectorizer-deprecation — temporal-staleness

**Checklist item:** N2

**Why:** The current date is 2026-07-09, more than a week after the stated June 30, 2026 removal date, so the page's future-tense framing ('will be removed', 'before June 30, 2026') is now stale — a reader can't tell from the page whether the removal already happened, is in progress, or was pushed back.

**Evidence:**

```
Frontmatter description: "Plan your move off Tiger Cloud-managed vectorizer workers and in-database LLM SQL helpers before June 30, 2026." Body: "The following AI capabilities are deprecated on Tiger Cloud and will be removed on June 30, 2026".
```

**Suggested fix:** Update the page to past tense confirming the removal occurred (or state the actual/revised removal date if it was extended), rather than leaving a passed deadline phrased as a future event.

**Deferral check:** This is a dated statement that has now lapsed relative to the current date, not a certification of the product's live behavior — flagged as suspected staleness per N2's deferral note, for the docs team to confirm the real removal status.

---

### 14. /get-started / /learn/tiger-cloud/tiger-cloud-essentials — cross-page-consistency

**Checklist item:** C2

**Why:** The two pages repeat what reads as the same specific benchmark triple (350x query speedup, 44% faster ingest) but give two different storage-reduction numbers (98% vs 90%) for the identical claim, so a reader comparing the two pages sees a direct contradiction about Hypercore's storage savings.

**Evidence:**

```
get-started/index.mdx: "Hypercore storage engine combines row and columnar storage, queries run up to 350x faster, ingestion is 44% faster, and storage shrinks by up to 98%." learn/tiger-cloud/tiger-cloud-essentials.mdx: "The Hypercore row-columnar engine in TimescaleDB makes queries up to 350x faster, ingests 44% faster, and reduces storage by 90%."
```

**Suggested fix:** Pick one storage-reduction figure for this specific 350x/44% benchmark claim and use it in both places (the corpus-wide majority figure is "up to 98%", used in understand-hypercore.mdx, data-lifecycle pages, basic-compression.mdx, and setup-hypercore.mdx).

**Deferral check:** This is not the 'up to N%' marketing-voice deferral (a single hedged superlative) but a same-claim numeric mismatch between two pages presenting what is otherwise an identical statistic, which C2 explicitly asks the agent to adjudicate as a real contradiction rather than intentional variation.

---

### 15. /integrate/code/connect-your-app — product-tag-truthfulness

**Checklist item:** A2

**Why:** A Cloud user following this page is told their prerequisite is installing a self-hosted TimescaleDB instance, which is wrong for their product and contradicts the page's own product tag.

**Evidence:**

```
Frontmatter: `products: [cloud, self_hosted]` but `description: "Integrate your app with self-hosted TimescaleDB using your preferred programming language"` and body: `Easily integrate your app with {C.SELF_LONG}.` The page's Prerequisites for every language tab (Ruby, Python, Node.js, Go, Java) import `IntegrationPrereqsSelfOnly from './_prereqs-self-instance.mdx'`, whose only content is `* A [{C.SELF_LONG}](/get-started/choose-your-path/install-timescaledb) instance.`
```

**Suggested fix:** Either narrow `products` to `[self_hosted]` to match the actual content, or swap the self-only prerequisite partial for one that covers both a Tiger Cloud service and a self-hosted instance (e.g. `_prereqs-cloud-and-self.mdx`, used by nearly every other integration guide) and adjust the description/intro sentence to mention both products.

**Deferral check:** This is a factual contradiction between the frontmatter product tag and the page's own prerequisites/description, not a style, prose, or link-target issue, so it is not covered by Vale or the links validator.

---

### 16. /integrate/configuration-deployment/terraform — prose-code-agreement

**Checklist item:** K2

**Why:** A `.tfvars` file uses plain `key = "value"` assignments; `export TF_VAR_x=...` is shell syntax for setting environment variables in a terminal session, not valid content for a `.tfvars` file. A reader who pastes this into `terraform.tfvars` as instructed gets a Terraform parse error.

**Evidence:**

```
"Create a `terraform.tfvars` file in the same directory as your `main.tf` to pass in the variable values:" followed by a code block containing `export TF_VAR_ts_project_id="<your-timescale-project-id>"` / `export TF_VAR_ts_access_key="..."` / `export TF_VAR_ts_secret_key="..."`.
```

**Suggested fix:** Either change the code block to valid tfvars syntax (`ts_project_id = "<your-timescale-project-id>"`, etc.) or change the instruction to say "export these as shell environment variables" instead of "create a terraform.tfvars file", matching whichever form the code block actually shows.

**Deferral check:** This is a mismatch between what the prose promises (a config file format) and the syntax actually shown in the adjacent code block, not a build/lint failure or an execution-correctness question the doc testing tool would catch (the snippet isn't run at build time).

---

### 17. /integrate/data-engineering-etl/amazon-sagemaker — example-naming-consistency

**Checklist item:** L1

**Why:** The prose tells the reader to check a table called `sensor_data`, which is never created anywhere on this page; the actual table (and the query shown) is `model_predictions`. A reader searching for `sensor_data` will not find it and may think the integration failed.

**Evidence:**

```
The page creates `CREATE TABLE model_predictions (time TIMESTAMPTZ NOT NULL, model_name TEXT NOT NULL, prediction DOUBLE PRECISION NOT NULL) ...`. In the final verification step: "Verify that the data is in your {C.SERVICE_SHORT}. Open an [SQL editor] ... and check the `sensor_data` table:" followed by `SELECT * FROM model_predictions;`.
```

**Suggested fix:** Change "check the `sensor_data` table" to "check the `model_predictions` table" to match the table created earlier on the page and the query actually shown.

**Deferral check:** This is an internal naming contradiction on a single page (prose vs. the adjacent SQL), not a broken link, prose-style, or unverified-SQL issue, so it is not handled by the linter, Vale, or the doc testing tool.

---

### 18. /integrate/data-engineering-etl/apache-airflow — example-naming-consistency

**Checklist item:** L1

**Why:** The DAG inserts into `crypto_assets` (the table actually created by the referenced tiger-cloud-essentials tutorial), but the surrounding prose and the final verification query both reference a table called `company`, which is never created by this page or the page it links to. Following the verification step exactly as written queries the wrong (likely nonexistent) table.

**Evidence:**

```
Intro: "This example DAG uses the `company` table you create in [Optimize time-series data in hypertables](...)". The DAG code executes `cursor.execute("INSERT INTO crypto_assets (symbol, name) VALUES (%s, %s)", ('NEW/Asset','New Asset Name'))`, followed immediately by "This DAG uses the `company` table created in [Create regular {C.PG} tables for relational data](...)". The final verification step says: "Run a query to view your data. For example: `SELECT symbol, name FROM company;`".
```

**Suggested fix:** Replace both prose mentions of the `company` table and the final `SELECT symbol, name FROM company;` with `crypto_assets`, matching the table actually created in /learn/tiger-cloud/tiger-cloud-essentials and the one the DAG's INSERT statement targets.

**Deferral check:** This is an internal object-naming contradiction between the SQL shown and the surrounding prose/verification step on one page, not a broken link or unverified-SQL execution question, so it is not covered by the links validator, Vale, or the doc testing tool.

---

### 19. /learn/data-lifecycle / /learn/data-management/data-lifecycle — duplicated-content

**Checklist item:** D1

**Why:** The redirect entry shows the page was already migrated to /learn/data-lifecycle, but the old source file at learn/data-management/data-lifecycle.mdx was never deleted, so an orphaned, image-less, TODO-laden duplicate of the page still exists in the content tree.

**Evidence:**

```
learn/data-management/data-lifecycle.mdx is a near-verbatim duplicate of learn/data-lifecycle/index.mdx (same title "Understand the data lifecycle", same description, same five-phase table and body text), except it lacks the ThemeImage diagrams the other page has and instead contains a leftover placeholder comment: "{/* TODO: Insert lifecycle diagram here */}". astro.config.ts already contains the redirect entry `"/learn/data-management/data-lifecycle": "/learn/data-lifecycle"`, and the sidebar only lists `/learn/data-lifecycle`.
```

**Suggested fix:** Delete src/content/docs/learn/data-management/data-lifecycle.mdx now that the redirect to /learn/data-lifecycle is in place and the sidebar only references the new location.

**Deferral check:** This is content-duplication drift (D1), not a broken-link or build issue; the existence of a working redirect plus a still-present source file is a content-authoring leftover, not something the link validator or build would flag as an error.

---

### 20. /learn/hypertables/creating-and-configuring-hypertables / /learn/hypertables/partitioning-hypertables / /learn/hypertables/sizing-hypertable-chunks / /learn/hypertables/hypertable-indexes / /learn/data-model/primary-keys-time-and-uniqueness — code-identifiers

**Checklist item:** F2

**Why:** Five pages in the core hypertables/data-model learn cluster teach a WITH-clause option namespace (`timescaledb.*`) that does not match the current reference documentation (`tsdb.*`), so a reader who copies these examples is using option names that are not the documented current syntax and may not work as described.

**Evidence:**

```
creating-and-configuring-hypertables.mdx: "CREATE TABLE order_events (...) WITH (timescaledb.hypertable, timescaledb.partition_column = 'created_at');" and a table listing `timescaledb.hypertable`, `timescaledb.partition_column`, `timescaledb.chunk_interval`, `timescaledb.create_default_indexes` as the WITH-clause option names. partitioning-hypertables.mdx: "WITH (timescaledb.hypertable, timescaledb.chunk_interval = '1 day')". sizing-hypertable-chunks.mdx: "WITH (timescaledb.hypertable, timescaledb.chunk_interval = '1 day')". hypertable-indexes.mdx: "You can disable this with `timescaledb.create_default_indexes = false`". primary-keys-time-and-uniqueness.mdx: "WITH (timescaledb.hypertable)" (three times). The reference page src/content/docs/reference/timescaledb/hypertables/create_table.mdx documents the current option namespace as `tsdb.hypertable`, `tsdb.partition_column`, `tsdb.chunk_interval`, `tsdb.create_default_indexes`, and sibling page /learn/hypertables/optimize-data-in-hypertables and /learn/continuous-aggregates and /learn/continuous-aggregates/time-and-continuous-aggregates correctly use `tsdb.hypertable` / `tsdb.partition_column` / `tsdb.chunk_interval`.
```

**Suggested fix:** Replace `timescaledb.hypertable`, `timescaledb.partition_column`, `timescaledb.chunk_interval`, and `timescaledb.create_default_indexes` with `tsdb.hypertable`, `tsdb.partition_column`, `tsdb.chunk_interval`, and `tsdb.create_default_indexes` in all five pages, matching /reference/timescaledb/hypertables/create_table and the sibling page optimize-data-in-hypertables.mdx.

**Deferral check:** This is not a compression/columnstore API rename (the Vale TigerData.CompressionAPIs deferral covers compress_chunk/enable_columnstore-style renames only); it is a hypertable-creation WITH-clause option namespace mismatch against the reference page, which F2 explicitly covers.

---

### 21. /reference/timescaledb/configuration / /reference/timescaledb/configuration/tiger-postgres / /reference/timescaledb/configuration/gucs — code-identifiers

**Checklist item:** F4

**Why:** Two reference pages in the same Configuration subsection tell a reader to SET a GUC named `timescaledb.vectorized_aggregation`, but the authoritative GUC list two clicks away names it `timescaledb.enable_vectorized_aggregation`; the neighboring examples for enable_chunkwise_aggregation and enable_merge_on_cagg_refresh correctly use the `enable_` prefix, so the missing prefix here is almost certainly a copy error, and running the documented command would fail with an unrecognized-parameter error.

**Evidence:**

```
configuration/index.mdx: "ALTER DATABASE your_database SET timescaledb.vectorized_aggregation = 'on';" and tiger-postgres.mdx (via _configuration-parameters.mdx): heading "##### `timescaledb.vectorized_aggregation (bool)`" — versus the canonical GUC list rendered on configuration/gucs.mdx (_timescaledb-gucs.mdx): "| `enable_vectorized_aggregation` | `BOOLEAN` | `true` | Enable vectorized aggregation for compressed data |"
```

**Suggested fix:** Change `timescaledb.vectorized_aggregation` to `timescaledb.enable_vectorized_aggregation` in configuration/index.mdx and in src/partials/_configuration-parameters.mdx (and check src/partials/_timescaledb-config.mdx, which has the same wrong heading and is used by the self-hosted deploy config page outside this scope).

**Deferral check:** Not a broken link or build error, and not the deprecated compression-API rename Vale already gates; this is a plain GUC-name spelling mismatch between two in-scope reference pages and the canonical GUC list, squarely inside F4.

---

### 22. /reference/timescaledb/continuous-aggregates/add_policies / /reference/timescaledb/continuous-aggregates/alter_policies / /reference/timescaledb/continuous-aggregates/show_policies / /reference/timescaledb/continuous-aggregates/add_continuous_aggregate_policy / /reference/timescaledb/informational-views/jobs — cross-page-consistency

**Checklist item:** C4

**Why:** The stable and experimental continuous-aggregate refresh-window functions document opposite ordering rules for what is presented as the same start/end offset relationship, and the experimental pages' own rule is contradicted by real example output shown elsewhere in the same corpus (show_policies.mdx, jobs.mdx) — a reader following add_policies.mdx's example would set refresh_start_offset smaller than refresh_end_offset, the reverse of what every other example in the corpus shows for this relationship.

**Evidence:**

```
add_continuous_aggregate_policy.mdx: "The `start_offset` should be greater than `end_offset`." (sample: start_offset => '1 month', end_offset => '1 hour'). add_policies.mdx / alter_policies.mdx: "`refresh_end_offset` ... Must be greater than `refresh_start_offset`." (sample: refresh_start_offset => '1 day', refresh_end_offset => '2 day'). But show_policies.mdx's own example output shows the opposite relationship: `{"refresh_end_offset": 1, "refresh_start_offset": 10}`, and informational-views/jobs.mdx shows `{"start_offset": "20 days", "end_offset": "10 days"}` — both with start > end, matching the stable API's rule, not the experimental pages' stated rule.
```

**Suggested fix:** Verify against the TimescaleDB source (timescaledb_experimental.add_policies) which ordering is actually enforced, then correct whichever of add_policies.mdx/alter_policies.mdx or show_policies.mdx's rule/example is wrong so all pages agree.

**Deferral check:** This is C4 (an ordering rule for the same parameter pair stated inconsistently across pages), not a SQL-execution question for the doc-testing tool — the contradiction is visible purely by comparing the stated rules and sample values across five reference pages.

---

### 23. /reference/timescaledb/data-retention / /reference/timescaledb/data-retention/add_retention_policy — prose-code-agreement

**Checklist item:** K1

**Why:** The code sets the interval to 6 months but the very next sentence says chunks created 3 months ago are selected — a direct, duplicated prose/code mismatch that would confuse a reader about what the example actually does.

**Evidence:**

```
Both pages contain the identical passage: "Create a data retention policy to discard chunks created before 6 months" followed by `SELECT add_retention_policy('conditions', drop_created_before => INTERVAL '6 months');` and then "When you call `drop_created_before`, {C.CHUNK}s created 3 months ago are selected."
```

**Suggested fix:** Change "3 months ago" to "6 months ago" (or change the INTERVAL to '3 months') in both data-retention/index.mdx and add_retention_policy.mdx.

**Deferral check:** This is not a broken-link or build issue and not about whether the SQL executes — it's a factual mismatch between the stated interval and the described result, K1's exact target, confirmed by direct quotation from both pages.

---

### 24. /reference/timescaledb/hyperfunctions / /reference/timescaledb/hyperfunctions/time-series-utilities / /reference/timescaledb/hyperfunctions/time-series-utilities/time_bucket — links-and-cross-references

**Checklist item:** G1

**Why:** Two overview pages promise a function called time_bucket_ng() with its own description, but the link resolves to the time_bucket() page, which documents only time_bucket() and never discusses time_bucket_ng — a reader clicking the link to learn about the 'next generation' function finds no trace of it, and the two overview pages even disagree on whether it's deprecated.

**Evidence:**

```
hyperfunctions/index.mdx, under "### Deprecated hyperfunctions": "- [`time_bucket_ng()`](/reference/timescaledb/hyperfunctions/time-series-utilities/time_bucket): next generation time bucketing with additional features". time-series-utilities/index.mdx lists the same link under "### Time bucketing" (not deprecated) with identical description. The target page, time_bucket.mdx, never mentions time_bucket_ng anywhere in its text.
```

**Suggested fix:** Either add a section documenting time_bucket_ng() (or a redirect/callout on time_bucket.mdx explaining its relationship to time_bucket_ng), or remove the time_bucket_ng() entries from both overview pages if the function is fully retired; also reconcile the deprecated-vs-not framing between the two overview pages.

**Deferral check:** The link is not broken (it resolves to a real page), so this passes the links-validator's scope; the defect is that the link's target does not deliver what the link text promises, which is G1, plus an N1 lifecycle-label disagreement between the two overview pages.

---

### 25. /reference/timescaledb/hypertables/create_hypertable / /reference/timescaledb/hypertables/add_dimension — version-claims

**Checklist item:** B1

**Why:** The badge at the top of each page tells the reader the documented syntax has been available since TimescaleDB 0.1.0, but the page's own prose says the by_range/by_hash syntax it documents was introduced in v2.13 — a reader on an older-but-supported TimescaleDB version would try this exact syntax based on the badge and get a syntax error.

**Evidence:**

```
create_hypertable.mdx: `<SinceRelease version="0.1.0" product="tsdb" />` at the top of the page, then later: "This page describes the generalized {C.HYPERTABLE} API introduced in {C.TIMESCALE_DB} v2.13." add_dimension.mdx has the identical pattern: `<SinceRelease version="0.1.0" product="tsdb" />` followed by "This page describes the generalized {C.HYPERTABLE} API introduced in {C.TIMESCALE_DB} v2.13.0."
```

**Suggested fix:** Change the SinceRelease badge on both pages to version="2.13.0" to match the prose (the 0.1.0 badge is accurate for the underlying create_hypertable/add_dimension function names, which is documented separately on the _old pages, but not for the by_range/by_hash signature shown here).

**Deferral check:** This is a self-contradiction within a single page (badge vs. prose) discovered by reading the page, not a version claim that merely looks suspicious in isolation — it directly disagrees with itself, which is B1/E2 territory, not a build or Vale concern.

---

### 26. /reference/toolkit/counters-and-gauges/gauge_agg/gauge_agg / /reference/toolkit/counters-and-gauges/gauge_agg/index / /reference/toolkit/counters-and-gauges/gauge_agg/corr / /reference/toolkit/counters-and-gauges/gauge_agg/delta / /reference/toolkit/counters-and-gauges/gauge_agg/extrapolated_delta / /reference/toolkit/counters-and-gauges/gauge_agg/extrapolated_rate / /reference/toolkit/counters-and-gauges/gauge_agg/gauge_zero_time / /reference/toolkit/counters-and-gauges/gauge_agg/idelta_left / /reference/toolkit/counters-and-gauges/gauge_agg/idelta_right / /reference/toolkit/counters-and-gauges/gauge_agg/intercept / /reference/toolkit/counters-and-gauges/gauge_agg/interpolated_delta / /reference/toolkit/counters-and-gauges/gauge_agg/interpolated_rate / /reference/toolkit/counters-and-gauges/gauge_agg/irate_left / /reference/toolkit/counters-and-gauges/gauge_agg/irate_right / /reference/toolkit/counters-and-gauges/gauge_agg/num_changes / /reference/toolkit/counters-and-gauges/gauge_agg/num_elements / /reference/toolkit/counters-and-gauges/gauge_agg/rate / /reference/toolkit/counters-and-gauges/gauge_agg/rollup / /reference/toolkit/counters-and-gauges/gauge_agg/slope / /reference/toolkit/counters-and-gauges/gauge_agg/time_delta / /reference/toolkit/counters-and-gauges/gauge_agg/with_bounds — code-identifiers

**Checklist item:** F3

**Why:** Every gauge_agg function lives in the `toolkit_experimental` schema per the product source (extension/src/gauge_agg.rs: `#[pg_extern(..., schema = "toolkit_experimental")]`), yet all 21 gauge_agg-specific pages omit the required prefix in their examples, contradicting both the parent overview and established docs convention (saturating-math, downsampling, state-tracking all prefix toolkit_experimental functions correctly), so readers copying these examples will hit 'function does not exist' errors.

**Evidence:**

```
gauge_agg/gauge_agg.mdx Samples: "SELECT time_bucket('1 day'::interval, ts) as dt, gauge_agg(ts, val) AS cs FROM foo..."; gauge_agg/delta.mdx: "SELECT id, delta(summary) FROM (SELECT id, gauge_agg(ts, val) AS summary FROM foo GROUP BY id) t" — every gauge_agg accessor page repeats this unprefixed pattern. Counter-example from counters-and-gauges/index.mdx shows correct prefixing: "toolkit_experimental.gauge_agg(ts, memory_usage)", "toolkit_experimental.delta(gauge_summary)".
```

**Suggested fix:** Add `toolkit_experimental.` prefix to every gauge_agg-family function call across all 21 pages in Samples and Arguments blocks, matching the pattern used correctly in counters-and-gauges/index.mdx and all other toolkit_experimental families in this reference section.

**Deferral check:** This is a cross-page and cross-family consistency check: the schema attribute is a fixed fact from the product source, not a runtime-execution question owned by the doc testing tool.

---

### 27. /reference/toolkit/counters-and-gauges/index / /reference/toolkit/counters-and-gauges/counter_agg/extrapolated_delta / /reference/toolkit/counters-and-gauges/counter_agg/extrapolated_rate — code-identifiers

**Checklist item:** F3

**Why:** The family overview example passes an INTERVAL literal as the second argument, but the dedicated reference pages (and the product source, extension/src/counter_agg.rs: `fn counter_agg_extrapolated_delta(summary: CounterSummary, method: &str)`) document that the second argument must be the TEXT string 'prometheus'. A reader copying the top-level example gets a 'function does not exist' error because no `extrapolated_delta(countersummary, interval)` overload exists.

**Evidence:**

```
counters-and-gauges/index.mdx, "Roll up and extrapolate counter values" sample: "extrapolated_delta(daily_cs, '1 day'::interval) AS estimated_total_bytes, extrapolated_rate(daily_cs, '1 day'::interval)" — vs. counter_agg/extrapolated_delta.mdx Arguments table: "method TEXT ... The only allowed value is `prometheus`."
```

**Suggested fix:** Change counters-and-gauges/index.mdx's example to: `extrapolated_delta(daily_cs, 'prometheus') AS estimated_total_bytes, extrapolated_rate(daily_cs, 'prometheus') AS estimated_avg_bytes_per_sec`

**Deferral check:** This is a signature/argument-type mismatch between reference pages and the family overview, confirmed against the accessor pages' documented signatures and the product source — not a runtime-execution verification.

---

### 28. /reference/toolkit/minimum-and-maximum/min_n/into_values — code-identifiers

**Checklist item:** F6

**Why:** min_n/into_values is stable in the real product, yet its only worked example still uses the old toolkit_experimental schema prefix, contradicting every sibling accessor page in the min_n/max_n family and risking a 'function does not exist' error for a reader who copies it.

**Evidence:**

```
min_n/into_values.mdx Samples section: "SELECT toolkit_experimental.into_values(\n    toolkit_experimental.min_n(sub.val, 5))\nFROM (...)" — vs. every sibling page in the same family: min_n/into_array.mdx: "SELECT into_array(\n    min_n(sub.val, 5))"; max_n/into_values.mdx: "SELECT into_values(\n    max_n(sub.val, 5))"
```

**Suggested fix:** Remove the toolkit_experimental. prefix from both function calls in min_n/into_values.mdx's Samples section to match into_array.mdx and all other stabilized accessors in this family.

**Deferral check:** This is a cross-family consistency check (comparing stable accessors across families) and a product-source verification, not a broken-link or build-failure check.

---

### 29. /reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/skewness — code-identifiers

**Checklist item:** F7

**Why:** The one-variable skewness() function's example output column was copy-pasted from the two-variable skewness_y()/skewness_x() page; the shown column name doesn't match what the documented function actually returns.

**Evidence:**

```
Sample query `SELECT skewness(stats_agg(data)) FROM generate_series(0, 100) data;` shows output header `skewness_x`, but the page's own Returns table says `| skewness | DOUBLE PRECISION | The skewness of the values in the statistical aggregate |`.
```

**Suggested fix:** Change the sample output block's column header from `skewness_x` to `skewness`.

**Deferral check:** Content mismatch between the page's own example output and its Returns table, not a linter/build concern; the query runs fine, only the illustrated column label is wrong.

---

### 30. /reference/toolkit/statistical-and-regression-analysis/stats_agg-one-variable/stddev — code-identifiers

**Checklist item:** F7

**Why:** The one-variable stddev() function's example output column was copy-pasted from the two-variable stddev_y()/stddev_x() page; a reader running the exact query shown would see a column named `stddev`, not `stddev_y`, contradicting the documented sample.

**Evidence:**

```
Sample query `SELECT stddev(stats_agg(data)) FROM generate_series(0, 100) data;` shows output header `stddev_y`, but the page's own Returns table says `| stddev | DOUBLE PRECISION | The standard deviation of the values in the statistical aggregate |`.
```

**Suggested fix:** Change the sample output block's column header from `stddev_y` to `stddev` to match the Returns table and the actual function name.

**Deferral check:** This is a content mismatch between prose/example output and the documented return shape on the same reference page, not a build/link/lint issue; the SQL statement itself is syntactically valid, only the displayed output label is wrong.

---

### 31. /reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/sum_y_x — code-identifiers

**Checklist item:** F7

**Why:** The Returns table documents the wrong column name, contradicting the sample output on the same page, and doesn't follow the `_y`/`_x` pattern used by sibling two-variable accessor pages.

**Evidence:**

```
The Samples section shows `SELECT sum_y(stats_agg(data, data)) FROM generate_series(0, 100) data;` returning a column named `sum_y`, but the Returns table on the same page says `| sum | DOUBLE PRECISION | The sum of the values in the statistical aggregate |`.
```

**Suggested fix:** Update the Returns table to document `sum_y` / `sum_x` instead of the generic `sum`.

**Deferral check:** Same-page contradiction between shown output and the Returns table, not a build/lint concern.

---

### 32. /reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/variance_y_x — code-identifiers

**Checklist item:** F7

**Why:** The Returns table documents the wrong column name; it directly contradicts the sample output shown immediately above it on the same page, and doesn't match the pattern used by the sibling stddev_y_x/skewness_y_x/kurtosis_y_x pages, which document both `_y` and `_x` return names.

**Evidence:**

```
The Samples section shows `SELECT variance_y(stats_agg(data, data)) FROM generate_series(0, 100) data;` returning a column named `variance_y`, but the Returns table on the same page says `| variance | DOUBLE PRECISION | The variance of the values in the statistical aggregate |`.
```

**Suggested fix:** Update the Returns table to document `variance_y` / `variance_x` (matching the pattern in stddev_y_x.mdx, skewness_y_x.mdx, kurtosis_y_x.mdx) instead of the generic `variance`.

**Deferral check:** Same-page contradiction between narrated/shown output and the Returns table (K3/F7), not a build or lint issue.

---

## MEDIUM Severity (26 findings)

### 1. /build/data-management/example-downsample-and-compress — destructive-operations

**Checklist item:** O1

**Why:** The custom job TRUNCATEs a live production chunk and repopulates it from a temp table, committing per chunk with no surrounding safeguard; if the job fails between the TRUNCATE and the INSERT, that chunk's data is permanently and irrecoverably lost, and the page never mentions this failure mode.

**Evidence:**

```
```sql
-- clear original chunk
EXECUTE format('TRUNCATE %s;', chunk);

-- copy downsampled data back into chunk
EXECUTE format('INSERT INTO %s(time, device_id, value) SELECT * FROM %I;', chunk, tmp_name);
...
COMMIT;
```
```

**Suggested fix:** Add a note about the crash/failure risk between TRUNCATE and INSERT and recommend a backup or staging step, similar to the caution already given for `skip_cagg_invalidation` on the insert-data page.

**Deferral check:** Flags a TRUNCATE statement shown without any consequence note, per O1, distinct from whether the PL/pgSQL actually runs correctly.

---

### 2. /build/data-management/run-queries-from-tiger-console — lifecycle-staleness

**Checklist item:** None

**Why:** A hardcoded roster of specific LLM model names rots every time a newer model ships (this very review is being run by a model newer than any listed here), so the enumerated list is already an inaccurate picture of what SQL Assistant actually supports.

**Evidence:**

```
"SQL Assistant supports a large number of LLMs, including: ... Claude 3.5 Haiku, Claud 3.7 Sonnet, Claud 3.7 Sonnet (extended thinking) ... Sonnet 4, Sonnet 4 (extended thinking), Opus 4, Opus 4 (extended thinking) ... Gemini 2.0 Flash"
```

**Suggested fix:** Replace the static model enumeration with a pointer to a live, product-owned source of truth (the in-app model picker, or a changelog) instead of a list hardcoded into the doc.

**Deferral check:** No checklistItem because there is no fixed pattern for "enumerated model roster"; flagged as suspected staleness (N2-style), not a certified defect — pure agentic judgment, stated as suspected per SKILL.md guidance.

---

### 3. /build/data-management/storage/manage-storage — destructive-operations

**Checklist item:** O1

**Why:** DROP TABLE here permanently destroys the hypertable's data on both the high-performance and low-cost (tiered) storage with no caution note, even though the page demonstrably uses warning callouts for less destructive nearby actions.

**Evidence:**

```
"### Drop tiered data\n\nTo drop tiered data, call [`DROP TABLE`](/build/data-management) on the corresponding {C.HYPERTABLE}. This removes the {C.HYPERTABLE} and all its associated data from the high-performance and low-cost storage." — no Callout accompanies this section, while the very next section, "Disable tiering", does carry `<Callout variant="important">Contact {C.COMPANY} support if you are disabling tiering...</Callout>`.
```

**Suggested fix:** Add a warning callout noting the action is irreversible and removes data from both storage tiers, matching the caution style already used elsewhere on this same page.

**Deferral check:** Flags a specific irreversible DROP TABLE shown with zero consequence warning (O1's exact pattern) on a page that otherwise uses warnings for similar actions — not a general formatting nit.

---

### 4. /deploy/mst/aiven-client — version-availability

**Checklist item:** B2

**Why:** PostgreSQL 11 is long past its community EOL and other MST/self-hosted pages in this same corpus reference current PostgreSQL 15-18 (for example uninstall.mdx and upgrade-pg.mdx). A copy-pasteable example hardcoding `pg_version=11` is very likely to fail against MST's currently supported PostgreSQL versions or mislead readers about what's supported.

**Evidence:**

```
'Create a read-only replica' example: `avn service create replica-fork --project fork-project\n-t pg --plan timescale-basic-100-compute-optimized\n--cloud timescale-aws-us-east-1 -c pg_read_replica=true\n-c service_to_fork_from=timescaledb -c\npg_version=11 -c variant=timescale`
```

**Suggested fix:** Verify against MST's currently supported PostgreSQL major versions and update the example to a supported version (matching the versions used elsewhere in the deploy docs).

**Deferral check:** This flags a suspected stale/unsupported version in a live example command for verification against the product, not a claim the engine certifies on its own.

---

### 5. /deploy/self-hosted/migration/schema-then-data — prose-code-agreement

**Checklist item:** K1

**Why:** The end date '2011-11-02' is earlier than the start date '2021-11-01', so as written the WHERE clause can never match any row (an impossible/empty range) — almost certainly a typo for '2021-11-02'. A reader copying this example to split a large table migration would get an empty file with no error, silently losing data from that range.

**Evidence:**

```
"If your tables are very large, you can migrate each table in multiple pieces... For example: \COPY (SELECT * FROM <TABLE_NAME> WHERE time > '2021-11-01' AND time < '2011-11-02') TO <TABLE_NAME_DATE_RANGE>.csv CSV"
```

**Suggested fix:** Change '2011-11-02' to '2021-11-02' so the example date range is valid.

**Deferral check:** This is a factual/logical defect in example code (an internally inconsistent value), not a prose or link issue, and not something the build would catch since the SQL is syntactically valid.

---

### 6. /deploy/self-hosted/replication-and-ha/configure-replication — destructive-ops

**Checklist item:** O1

**Why:** `rm -rf <DATA_DIRECTORY>/*` is an irreversible filesystem deletion shown as a plain instruction with no callout warning about consequences (contrast with uninstall.mdx, which wraps every comparable `rm -rf`/`DROP ... CASCADE` step in an explicit warning Callout). If a reader runs this against the wrong host, or the directory variable is wrong, there is no accompanying caution to stop them.

**Evidence:**

```
'Create a base backup on the replica' > 'Delete the existing data if applicable': "If the replica database already contains data, delete it before you run the backup, by removing the PostgreSQL data directory: ```rm -rf <DATA_DIRECTORY>/*```"
```

**Suggested fix:** Add a `<Callout variant="warning">` noting this permanently deletes the target directory's contents and that it must only be run against the replica (never the primary), consistent with how the rest of the deploy docs flag destructive commands.

**Deferral check:** This is a content-completeness gap (a dangerous action lacking its required caution), the exact pattern O1 targets — not a prose/formatting nit.

---

### 7. /deploy/self-hosted/tooling/install-toolkit — prose-code-agreement

**Checklist item:** K2

**Why:** The warning talks about the consequences of `CASCADE`, but the Kubernetes command shown doesn't use `CASCADE` at all — a sign the step was duplicated across OS/platform tabs and drifted, leaving a caution that doesn't match the adjacent code.

**Evidence:**

```
Kubernetes tab, 'Uninstall TimescaleDB Toolkit' step: code block `DROP EXTENSION timescaledb_toolkit;` (no CASCADE, no IF EXISTS) immediately followed by `<Callout variant="warning">Using \`CASCADE\` drops all objects that depend on the Toolkit extension...</Callout>`. The Docker tab's equivalent step correctly pairs `DROP EXTENSION IF EXISTS timescaledb_toolkit CASCADE;` with the identical warning text.
```

**Suggested fix:** Add `IF EXISTS ... CASCADE` to the Kubernetes tab's `DROP EXTENSION` command to match the Docker/Linux/macOS tabs and the warning text, or remove the CASCADE-specific warning if CASCADE is intentionally omitted there.

**Deferral check:** This is a factual mismatch between a warning's claim and the code it annotates, not a formatting/callout-variant issue.

---

### 8. /deploy/tiger-cloud/tiger-cloud-aws/security/members / /deploy/tiger-cloud/tiger-cloud-azure/security/members — destructive-ops

**Checklist item:** O2

**Why:** Transferring project ownership immediately and irreversibly (from the current owner's perspective, short of contacting support) removes the transferring user's owner rights, but this consequence is buried in a plain sentence rather than called out, unlike other note-worthy consequences on the same page (which does use Callouts elsewhere, for example for the single-project-per-email rule).

**Evidence:**

```
"## Transfer Project ownership\n\n...As the Project Owner, you have rights to add and delete users, edit Project settings, and transfer the Owner role to another user. When you transfer ownership to another user, you lose your ownership rights." — no Callout accompanies this irreversible-for-the-transferring-user action.
```

**Suggested fix:** Add a `<Callout variant="warning">` or `<Callout variant="important">` immediately before the transfer-ownership procedure noting that the action cannot be undone by the transferring user without contacting support.

**Deferral check:** This concerns the doc's presentation of an irreversible account-level action, not whether the Console feature itself works.

---

### 9. /deploy/tiger-cloud/tiger-cloud-aws/tiger-cloud-extensions / /deploy/tiger-cloud/tiger-cloud-azure/tiger-cloud-extensions — version-availability

**Checklist item:** B1

**Why:** The extensions index lists pg_textsearch as production-ready at v1.0.0, but the dedicated pg_textsearch page (linked from the same table) says v1.1.0 is the production-ready version — the version number in the index is stale.

**Evidence:**

```
Extensions index table: "| pg_textsearch | BM25-based full-text search | Production-ready (v1.0.0) |". The pg_textsearch page itself (same section) states: "pg_textsearch v1.1.0 is production-ready on Tiger Cloud. See the v1.1.0 release notes."
```

**Suggested fix:** Update the extensions index table to say "Production-ready (v1.1.0)" to match the pg_textsearch page.

**Deferral check:** This is a version-number mismatch between two content pages about the same extension, verifiable by direct comparison — not a build or link-check concern.

---

### 10. /get-started/news/release-notes — links

**Checklist item:** G3

**Why:** A reader visiting the Release notes page to check for pgvectorscale updates is sent to the 0.2.0 tag specifically, several major versions behind the actual latest release (0.9.0), which misleads them about what's current instead of showing the full release history like the other links on the same page.

**Evidence:**

```
release-notes.mdx links pgvectorscale to a hardcoded old tag: "[pgvectorscale](https://github.com/timescale/pgvectorscale/releases/tag/0.2.0) - higher performance embedding search..." while every other product link on the same page (TimescaleDB, Toolkit, pgai, pg_spot) points to the general `/releases` page. The current latest pgvectorscale release is 0.9.0 (confirmed via the GitHub releases page).
```

**Suggested fix:** Change the pgvectorscale link to the general releases page (https://github.com/timescale/pgvectorscale/releases), matching the pattern used for every other product link on this page.

**Deferral check:** The link is not broken (it resolves), so this isn't the link-validator's job; it is a link that points at a stale, misleading target relative to its purpose and the surrounding pattern on the same page, which G3 covers.

---

### 11. /integrate/query-administration/psql — code-identifiers

**Checklist item:** F1

**Why:** `ef` without the leading backslash is not a valid psql meta-command (the real command is `\ef`); a reader who types `ef <FUNCTION_NAME>` literally, as shown, gets an error instead of opening the function editor.

**Evidence:**

```
In the "Useful psql commands" table, every row shows a backslash meta-command (`\c`, `\d`, `\df`, `\di`, `\dn`, `\dt`, `\du`, `\dv`, `\dx`, `\h`, `\l`, `\password`, `\q`, `\set`, `\timing`, `\x`, `\?`) except one row: `|ef <FUNCTION_NAME>|Edit a function|`.
```

**Suggested fix:** Change `ef <FUNCTION_NAME>` to `\ef <FUNCTION_NAME>` to match the real psql command and the formatting of every other row in the table.

**Deferral check:** This is a spelling/identifier error in a reference table, not a prose-style nit or a broken link, and the doc testing tool's SQL-execution checks would not exercise a psql meta-command listed only in a markdown table.

---

### 12. /learn/capabilities-and-comparison/understand-capabilities / /get-started / /learn/tiger-cloud/tiger-cloud-essentials — cross-page-consistency

**Checklist item:** C2

**Why:** The maximum query-speedup figure attributed to Hypercore differs by roughly 3x between understand-capabilities.mdx (up to 1000x) and the two other pages describing the same feature (up to 350x), which could give a reader materially different performance expectations depending which page they land on.

**Evidence:**

```
understand-capabilities.mdx: "delivering 100x to 1000x performance improvements for analytical queries" (Hypercore, Typical workflow section). get-started/index.mdx and learn/tiger-cloud/tiger-cloud-essentials.mdx both state Hypercore "makes queries up to 350x faster."
```

**Suggested fix:** Align understand-capabilities.mdx's performance-improvement figure with the "up to 350x" figure used in get-started/index.mdx and tiger-cloud-essentials.mdx, or cite a specific benchmark source if the higher figure is a different, disclosed measurement.

**Deferral check:** Distinguishable from the accepted 'up to N%'-style marketing-voice deferral because it is a specific multiplier range (100x-1000x) that conflicts with a specific multiplier (350x) stated elsewhere for the same feature, not a single hedged superlative in isolation.

---

### 13. /learn/data-lifecycle/data-retention/data-retention-with-continuous-aggregates — code-identifiers

**Checklist item:** F3

**Why:** This is the only page in the corpus that calls add_continuous_aggregate_policy with bare positional string arguments instead of the named-argument form the reference page and every sibling page (data-lifecycle/index.mdx, get-started tutorials) use, so a reader following this example learns a call style that is inconsistent with the documented convention and easier to get wrong if argument order is ever misremembered.

**Evidence:**

```
data-retention-with-continuous-aggregates.mdx: "SELECT add_continuous_aggregate_policy('conditions_summary_daily', '7 days', '1 day', '1 day');" using positional arguments, versus the reference page (/reference/timescaledb/continuous-aggregates/add_continuous_aggregate_policy) and every other page in the corpus that calls this function using named arguments: "SELECT add_continuous_aggregate_policy('conditions_summary', start_offset => INTERVAL '1 month', end_offset => INTERVAL '1 hour', schedule_interval => INTERVAL '1 hour');"
```

**Suggested fix:** Rewrite the call using named arguments: `add_continuous_aggregate_policy('conditions_summary_daily', start_offset => INTERVAL '7 days', end_offset => INTERVAL '1 day', schedule_interval => INTERVAL '1 day')`, matching the reference page's sample.

**Deferral check:** This is a call-syntax/style mismatch against the documented signature (F3), not a claim that the function fails to run, which is the doc-testing tool's job to certify.

---

### 14. /migrate/troubleshooting — destructive-operation-cautions

**Checklist item:** O1

**Why:** `DROP EXTENSION timescaledb` on a service that may already hold hypertables and continuous aggregates is a destructive, service-affecting action (it removes TimescaleDB functionality until recreated), shown here as a plain numbered step with no caution about impact or the need for a backup before running it.

**Evidence:**

```
Under "Source and target databases have different TimescaleDB versions" → **Downgrade**: "reinstall an older version of {C.TIMESCALE_DB} on your {C.SERVICE_LONG} that matches the source database" followed by a numbered step showing `DROP EXTENSION timescaledb;` `CREATE EXTENSION timescaledb VERSION '<version>';` with only a `<Callout variant="tip">` about needing `psql -X` to reconnect — no warning about the effects of dropping the extension.
```

**Suggested fix:** Add a caution callout before the `DROP EXTENSION timescaledb` step noting that this removes TimescaleDB functionality from the service until the extension is recreated, and recommending a backup or a non-production test first.

**Deferral check:** This is about the presence of a caution next to a destructive SQL statement, not whether the statement executes correctly, so it isn't covered by the doc testing tool's execution checks or by Vale.

---

### 15. /reference/timescaledb/administration / /reference/timescaledb/administration/timescaledb_pre_restore / /reference/timescaledb/administration/timescaledb_post_restore — product-tags

**Checklist item:** A1

**Why:** The overview page is tagged for both products and presents a pg_dump/pg_restore workflow as generally applicable, but the two functions at the center of that workflow are documented (on their own pages, one click away) as self-hosted only — a Tiger Cloud reader following the overview's workflow would attempt functions that don't apply to their deployment.

**Evidence:**

```
administration/index.mdx is tagged `products: [cloud, self_hosted]` and includes "### Full backup and restore workflow ... Complete workflow for backing up and restoring a TimescaleDB database" using `timescaledb_pre_restore()`, `pg_dump`/`pg_restore`, and `timescaledb_post_restore()` with no product caveat. Both timescaledb_pre_restore.mdx and timescaledb_post_restore.mdx are tagged `products: [self_hosted]` only.
```

**Suggested fix:** Add a note on administration/index.mdx's backup/restore workflow section stating it applies to self-hosted deployments only, or split the workflow sample so cloud readers are pointed to the Cloud-specific backup/restore documentation instead.

**Deferral check:** This is A1 (cloud/self-hosted scope mismatch on a page's promised applicability), discovered by comparing the overview's product tag and content against its own linked child pages' narrower tags — not a broken link or formatting issue.

---

### 16. /reference/timescaledb/configuration/gucs — code-identifiers

**Checklist item:** F5

**Why:** Three rows in the GUC reference table show raw, unresolved C source identifiers (macro names and even a function name used as a 'max' value) instead of the actual default/limit values a reader needs, making these three settings' documented defaults unusable as written.

**Evidence:**

```
In the rendered GUC list (src/partials/_timescaledb-gucs.mdx): `| \`stats_max_chunks\` | \`INTEGER\` | \`TS_STATS_MAX_CHUNKS_DEFAULT, /* default */0, /* min: 0 = disabled */TS_STATS_MAX_CHUNKS_MAX, /* max: 2^18 = 262144 chunks */PGC_SIGHUP\` | ... max: \`stats_max_chunks_check_hook\` |` and `| \`license\` | \`STRING\` | \`TS_LICENSE_DEFAULT\` | ... |` and `| \`telemetry_level\` | \`ENUM\` | \`TELEMETRY_DEFAULT\` | ... |`
```

**Suggested fix:** Fix the GUC-table generation for these three rows so the Default/min/max columns show resolved values (for example, telemetry_level's actual default is a string like 'basic', not the macro TELEMETRY_DEFAULT), matching the clean values shown for every neighboring row.

**Deferral check:** This is a factual-value defect in the reference table itself (F5: types/values must be stated correctly), not a build failure or a Vale style rule — the table renders fine, it just contains wrong/unreadable data for three settings.

---

### 17. /reference/timescaledb/hyperfunctions/time_bucket_gapfill/time_bucket_gapfill — table-integrity

**Checklist item:** None

**Why:** The two most important argument rows have more pipe-separated cells than the table has columns, which shifts Type/Default/Required values into the wrong columns when rendered — a reader checking whether bucket_width is required, or what its default is, would see misaligned data. Pure judgment finding: no single checklist item names malformed tables, but it undermines the same factual columns F3/F5 care about.

**Evidence:**

```
Arguments table header is `| Name | Type | Default | Required | Description |` (5 columns) but the bucket_width and ts rows have extra cells: `| \`bucket_width\` | INTERVAL | INTEGER | - | ✔ | A ... |` and `| \`ts\` | TIMESTAMPTZ | TIMESTAMP | DATE | SMALLINT | INT | BIGINT | - | ✔ | The timestamp on which to base the bucket |`
```

**Suggested fix:** Rewrite the bucket_width and ts rows to fit the 5-column table, folding the multiple accepted types into a single Type cell (for example `INTERVAL or INTEGER`, `TIMESTAMPTZ, TIMESTAMP, DATE, SMALLINT, INT, or BIGINT`) as done correctly elsewhere in the same reference section.

**Deferral check:** This is not a Vale/formatting-convention issue (callout variants, heading style) — the table still builds fine, but its columns misalign in the rendered output, corrupting the factual type/required/default data the table exists to convey.

---

### 18. /reference/timescaledb/hypertables/create_table / /reference/timescaledb/hypercore/alter_table — types-and-behavior

**Checklist item:** F5

**Why:** CREATE TABLE ... WITH (tsdb.orderby) and ALTER TABLE ... SET (timescaledb.compress_orderby) configure the same underlying columnstore orderby setting, but only one of the two reference pages tells the reader that the automatically-created sparse index type changed from minmax to firstlast in 2.28.0 — a reader using ALTER TABLE would be told the index is always minmax, which is stale for 2.28.0+.

**Evidence:**

```
create_table.mdx, `tsdb.orderby` row: "Setting `tsdb.orderby` automatically creates an implicit sparse index on the `orderby` column: a `firstlast` index since 2.28.0, `minmax` before." alter_table.mdx, `timescaledb.compress_orderby` row: "Setting `timescaledb.compress_orderby` automatically creates an implicit min/max sparse index on the `orderby` column." (no mention of the 2.28.0 change to firstlast).
```

**Suggested fix:** Add the same "firstlast index since 2.28.0, minmax before" clarification to the `timescaledb.compress_orderby` row in alter_table.mdx.

**Deferral check:** This is a factual behavior/type description for a configuration option, not the compress_chunk-to-convert_to_columnstore naming rename Vale already gates, and not a build/link issue — it's F5's type/behavior-consistency check across two pages describing the same setting.

---

### 19. /reference/timescaledb/hypertables/disable_chunk_skipping / /reference/timescaledb/hypertables/enable_chunk_skipping — current-syntax

**Checklist item:** F6

**Why:** The disable_chunk_skipping example teaches the superseded create_hypertable('table','column') form instead of the current CREATE TABLE ... WITH (tsdb.hypertable) syntax used one page over for the exact same setup, so a reader following only this page learns an outdated pattern.

**Evidence:**

```
disable_chunk_skipping.mdx sample: "SELECT create_hypertable('conditions', 'time');\nSELECT enable_chunk_skipping('conditions', 'device_id');\nSELECT disable_chunk_skipping('conditions', 'device_id');" — using the two-argument positional (old-interface) create_hypertable call. Its sibling page enable_chunk_skipping.mdx instead uses `CREATE TABLE conditions (...) WITH (tsdb.hypertable);` for the identical setup.
```

**Suggested fix:** Replace the create_hypertable('conditions', 'time') call in disable_chunk_skipping.mdx with the same CREATE TABLE ... WITH (tsdb.hypertable) pattern used in enable_chunk_skipping.mdx.

**Deferral check:** This is not the compress_chunk/columnstore rename Vale already gates — it's the separate, still-current hypertable-creation API (CREATE TABLE vs. legacy create_hypertable), which is explicitly F6's concern (current recommended syntax vs. a superseded form).

---

### 20. /reference/toolkit/candlestick_agg/rollup — version-claims

**Checklist item:** B1

**Why:** Per timescaledb-toolkit's Changelog.md, the entire Candlestick feature (including rollup) was introduced together in 1.12.0 and stabilized together in 1.14.0 ('Stabilize candlestick', PR #701). Twelve sibling pages correctly show 1.14.0, but rollup.mdx alone shows 1.12.0, creating a factual disagreement about when this function stabilized.

**Evidence:**

```
candlestick_agg/rollup.mdx: '<SinceRelease version="1.12.0" product="toolkit" />' — vs. all 12 sibling pages in the same family (candlestick_agg.mdx, candlestick.mdx, open.mdx, open_time.mdx, high.mdx, high_time.mdx, low.mdx, low_time.mdx, close.mdx, close_time.mdx, volume.mdx, vwap.mdx): '<SinceRelease version="1.14.0" product="toolkit" />'
```

**Suggested fix:** Change rollup.mdx's <SinceRelease> version from "1.12.0" to "1.14.0" to match the other 12 pages in the candlestick_agg family.

**Deferral check:** Verified against the actual project changelog; this is a cross-page version/factual consistency issue (B1), not a broken link or build failure.

---

### 21. /reference/toolkit/counters-and-gauges/counter_agg/with_bounds / /reference/toolkit/counters-and-gauges/gauge_agg/with_bounds — code-identifiers

**Checklist item:** F3

**Why:** `time_bucket_range` is an experimental helper (not in STABLE_FUNCTIONS), so it requires the toolkit_experimental prefix as extrapolated_delta.mdx and extrapolated_rate.mdx correctly show in both families. with_bounds.mdx calls the same helper unprefixed, one page over from where it's prefixed correctly, creating reader confusion.

**Evidence:**

```
counter_agg/with_bounds.mdx Samples: "extrapolated_rate(with_bounds(summary, time_bucket_range('15 min'::interval, bucket)), 'prometheus')" — vs. counter_agg/extrapolated_rate.mdx Samples: "extrapolated_rate(with_bounds(summary, toolkit_experimental.time_bucket_range('15 min'::interval, bucket)),'prometheus')". Same unprefixed pattern in gauge_agg/with_bounds.mdx.
```

**Suggested fix:** Add the `toolkit_experimental.` prefix to `time_bucket_range(...)` in the Samples block of both counter_agg/with_bounds.mdx and gauge_agg/with_bounds.mdx.

**Deferral check:** This is a same-corpus naming/prefix consistency check for the same helper function between reference pages, not a doc-testing-tool execution check.

---

### 22. /reference/toolkit/percentile-approximation/uddsketch/approx_percentile — code-identifiers

**Checklist item:** F2

**Why:** The signature and the parameter table on the same page disagree on the parameter's name; a reader using named-argument call syntax would not know which name PostgreSQL actually expects, and every sibling uddsketch accessor (approx_percentile_rank, error, mean, num_vals, rollup, total) consistently uses `sketch` in both places.

**Evidence:**

```
The syntax block names the second parameter `uddsketch`: ```approx_percentile(\n  percentile DOUBLE PRECISION,\n  uddsketch  UddSketch\n) RETURNS DOUBLE PRECISION```, but the Arguments table directly below names the same parameter `sketch`: `| sketch | UddSketch | - | ✔ | the uddsketch aggregate |`.
```

**Suggested fix:** Rename the signature block's second parameter from `uddsketch` to `sketch` to match the Arguments table and sibling pages.

**Deferral check:** Within-page parameter-name mismatch between the documented signature and the parameter table, not a build/lint/link issue.

---

### 23. /reference/toolkit/state-tracking/heartbeat_agg/dead_ranges / /reference/toolkit/state-tracking/heartbeat_agg/downtime / /reference/toolkit/state-tracking/heartbeat_agg/uptime / /reference/toolkit/state-tracking/heartbeat_agg/live_at / /reference/toolkit/state-tracking/heartbeat_agg/live_ranges / /reference/toolkit/state-tracking/heartbeat_agg/num_gaps / /reference/toolkit/state-tracking/heartbeat_agg/num_live_ranges / /reference/toolkit/state-tracking/heartbeat_agg/interpolate / /reference/toolkit/state-tracking/heartbeat_agg/interpolated_downtime / /reference/toolkit/state-tracking/heartbeat_agg/interpolated_uptime / /reference/toolkit/state-tracking/heartbeat_agg/rollup / /reference/toolkit/state-tracking/heartbeat_agg/trim_to — code-identifiers

**Checklist item:** F5

**Why:** The custom aggregate type is spelled three different ways across this one function family (`HEARTBEATAGG`, `HeartbeatAgg`, `heartbeat_agg`), while the sibling state_agg and compact_state_agg families consistently use PascalCase (`StateAgg`, `CompactStateAgg`) in both the signature block and the tables; a reader can't tell which spelling is the real type name.

**Evidence:**

```
dead_ranges.mdx's syntax block is `dead_ranges(\n    agg HEARTBEATAGG\n) RETURNS TABLE (...)`, using all-caps `HEARTBEATAGG`, while its own Arguments table says `| agg | HeartbeatAgg | - | ✔ | ... |`. The same all-caps-vs-PascalCase split appears in downtime, uptime, live_at, live_ranges, num_gaps, num_live_ranges, interpolate, interpolated_downtime, interpolated_uptime, and rollup.mdx. trim_to.mdx adds a third spelling: its Returns table says `| trim_to | heartbeat_agg | The trimmed aggregate. |` (lowercase-with-underscore), while its own Arguments table two lines above says `| agg | HeartbeatAgg | ... |`.
```

**Suggested fix:** Replace `HEARTBEATAGG` with `HeartbeatAgg` in every heartbeat_agg signature block, and fix trim_to.mdx's Returns row to say `HeartbeatAgg` instead of `heartbeat_agg`, matching the constructor page (heartbeat_agg.mdx) which already returns `HeartbeatAgg`.

**Deferral check:** This is a factual type-name consistency issue (F5) across reference pages the engine owns, not the Vale ProductConstants rule (which only covers product/brand names) and not a build error (mismatched casing in a fenced code block doesn't fail the build).

---

### 24. /reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/average_y_x — code-identifiers

**Checklist item:** F7

**Why:** Readers running the example as written would see a column named `average_x` (PostgreSQL's default alias is the function name), not the generic `average` shown, which is inconsistent with how every sibling two-variable accessor page illustrates its output.

**Evidence:**

```
Sample query calls `average_x(stats_agg(y, x))` but the shown output header is `average`, whereas sibling pages in the same family show the function-specific column name for the function actually called (for example `variance_y_x` shows `variance_y` for a `variance_y(...)` call, and `skewness_y_x` shows `skewness_x` for a `skewness_x(...)` call).
```

**Suggested fix:** Change the sample output column header from `average` to `average_x` to match the query and the pattern used on stddev_y_x, variance_y_x, skewness_y_x, and kurtosis_y_x.

**Deferral check:** Cross-page consistency of documented return shape for the same function family, not a formatting/lint concern.

---

### 25. /reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/x_intercept / /reference/toolkit/statistical-and-regression-analysis/stats_agg-two-variables/intercept — code-identifiers

**Checklist item:** F7

**Why:** The x_intercept() function's default output column (per PostgreSQL's function-name-as-alias convention) would be `x_intercept`, not `intercept`; the Returns table appears to be a copy of intercept.mdx's row without renaming the column.

**Evidence:**

```
x_intercept.mdx's Returns table says `| intercept | DOUBLE PRECISION | The x intercept of the least-squares fit line |` for the `x_intercept()` function, identical to the wording used on the sibling intercept.mdx page (`| intercept | DOUBLE PRECISION | The y intercept of the least-squares fit line |`) for the differently-named `intercept()` function.
```

**Suggested fix:** Change the Returns table column name on x_intercept.mdx from `intercept` to `x_intercept`.

**Deferral check:** Documented return-shape mismatch on the reference page itself, not a link/build/lint concern.

---

### 26. /reference/toolkit/time_weight/first_time / /reference/toolkit/time_weight/first_val / /reference/toolkit/time_weight/last_time / /reference/toolkit/time_weight/last_val / /reference/toolkit/time_weight/rollup — code-identifiers

**Checklist item:** F2

**Why:** Across five of the ten time_weight pages, the parameter name in the SQL signature block does not match the name used in the accompanying Arguments table on the same page, while the family's average/integral/interpolated_average/interpolated_integral pages consistently use `tws` in both places.

**Evidence:**

```
first_time.mdx's syntax block is `first_time(\n    tw TimeWeightSummary\n) RETURNS TIMESTAMPTZ`, naming the parameter `tw`, but the Arguments table below names it `tws`: `| tws | TimeWeightSummary | - | ✔ | The input TimeWeightSummary from a time_weight() call |`. The identical `tw` (signature) vs `tws` (table) mismatch repeats on first_val.mdx and last_time.mdx and last_val.mdx. rollup.mdx has the reverse-flavored version: signature names the parameter `tws` (`rollup(tws TimeWeightSummary) RETURNS TimeWeightSummary`) but the table names it `time_weight` (`| time_weight | TimeWeightSummary | - | ✔ | The TimeWeightSummary aggregate produced by a time_weight call |`).
```

**Suggested fix:** Standardize on `tws` in both the signature and the Arguments table for first_time, first_val, last_time, last_val, and rollup, matching average.mdx and integral.mdx.

**Deferral check:** Within-page parameter-name mismatches on five reference pages, not a build/lint/link issue.

---

## LOW Severity (15 findings)

### 1. /build/cost-optimization / /build/data-management/hyperfunctions / /build/data-management/hyperfunctions/gapfilling-interpolation / /build/data-management/hyperfunctions/percentile-approx / /build/data-management / /build/examples / /build / /build/performance-optimization / /build/tips-and-tricks — product-tag

**Checklist item:** A4

**Why:** The repo's own contributor guide states `products` is required on every content page, but every section-landing/hub page in this shard omits it, which either violates the stated policy or means the policy has an undocumented exception for hub pages.

**Evidence:**

```
Each page's frontmatter has only `title`/`description` (plus optionally `keywords`/`learnMore`) and no `products` field at all, e.g. /build/cost-optimization: `---\ntitle: Cost optimization\ndescription: Reduce storage and compute costs\n---`
```

**Suggested fix:** Either add an appropriate `products` tag to these hub pages, or update the written policy to explicitly exempt overview/index pages (this same pattern repeats on ~35 hub pages across all seven tabs sitewide, so it reads as a deliberate convention rather than an isolated defect).

**Deferral check:** A4 is the mechanical catalog check for a missing tag; reported once as a batched low-severity finding (not per-page high severity) because the consistent sitewide pattern indicates intentional convention, but it still contradicts the written contributor policy.

---

### 2. /build/cost-optimization — content-completeness

**Checklist item:** None

**Why:** Four of the five action bullets on this hub page ("Reduce storage costs with compression", "Configure appropriate retention policies", "Right-size your instance", "Monitor resource usage") are plain unlinked text with no destination, unlike every sibling hub page in this shard (for example /build/data-management or /build/performance-optimization), which routes every listed item through a link or a RelatedContentCard.

**Evidence:**

```
"## I want to reduce…\n\n- Reduce storage costs with compression\n- Use [tiered storage](/learn/data-lifecycle/storage/about-storage-tiers) for cold data\n- Configure appropriate retention policies\n\n## Compute costs\n\n- Right-size your instance\n- Monitor resource usage"
```

**Suggested fix:** Link each bullet to its corresponding guide (for example, compression to /build/how-to/basic-compression, retention to /build/data-management/data-retention/create-a-retention-policy) or convert the section to RelatedContentCards like comparable hub pages.

**Deferral check:** Not a broken-link issue (there is no href to check) and not a prose nit; this is a hub page failing at its stated navigational purpose, which is pure agentic judgment with no fixed checklist pattern.

---

### 3. /build/examples/aggregate-organizational-data-with-ai — content-completeness

**Checklist item:** None

**Why:** This reads as an internal editorial placeholder left in published content: it implies a specific walkthrough video exists, but the link only points at the general YouTube channel and the parenthetical admits the real video isn't linked yet.

**Evidence:**

```
"(Optional) You can also watch a walkthrough [on the Tiger Data YouTube channel](https://www.youtube.com/@tigerdata) (insert video link when available)."
```

**Suggested fix:** Add the real video link once available, or remove the "(insert video link when available)" placeholder text before publishing.

**Deferral check:** Not a broken link or prose-style issue; it's a factual claim (a specific video exists) undercut by its own placeholder text — agentic judgment, no fixed pattern for a leftover editorial TODO.

---

### 4. /build/examples/simulate-iot-sensor-data — prose-code-agreement

**Checklist item:** K3

**Why:** One row's year is 2030 instead of 2020, which is internally inconsistent with the surrounding rows and would violate the query's own `ORDER BY time` if the timestamp were taken literally.

**Evidence:**

```
Sample output for `SELECT * FROM sensor_data ORDER BY time;`:
```
 2020-03-31 15:56:40.244287+00 |         2 |    26.589260622859 |   0.229583469685167
 2030-03-31 15:56:45.653115+00 |         3 |   79.9925176426768 |   0.457779890391976
 2020-03-31 15:56:53.560205+00 |         4 |   24.3201029952615 |   0.641885648947209
```
```

**Suggested fix:** Fix the typo so the row reads 2020-03-31 to match the surrounding sample output.

**Deferral check:** This is a factual internal-consistency defect in the displayed sample output (narrated output vs. shown data), not a prose/style nit, broken link, or a claim about whether the SQL executes.

---

### 5. /deploy/mst/create-mst-service — lifecycle-staleness

**Checklist item:** N2

**Why:** These illustrative outputs show PostgreSQL 13 and TimescaleDB 2.5.1, both several years out of date compared to the versions referenced elsewhere in the current deploy docs (PostgreSQL 15-18, TimescaleDB 2.17+); a new user creating a service today would see very different, newer version numbers and might wonder if something is wrong.

**Evidence:**

```
Example `\dx` and connection output: "psql (13.3, server 13.4)" and "Name | timescaledb / Version | 2.5.1 / ... Enables scalable inserts and complex queries for time-series data"
```

**Suggested fix:** Refresh the example psql banner and \dx output to reflect a current PostgreSQL/TimescaleDB version, or generalize the version numbers so they don't read as a specific expected version.

**Deferral check:** Suspected-only staleness in an illustrative example, flagged per N2's deferral (real current version is a product fact, not certified here) rather than a formatting concern.

---

### 6. /deploy/tiger-cloud/tiger-cloud-aws/pricing-and-account-management / /deploy/tiger-cloud/tiger-cloud-azure/pricing-and-account-management — cross-page-factual-consistency

**Checklist item:** C2

**Why:** On AWS, the Enterprise IO Boost bandwidth (2,000 MB/s) is higher than Scale's (1,500 MB/s), matching the higher IOPS figure at that tier, but on Azure the Scale and Enterprise bandwidth figures are identical (1200 MB/s) despite IOPS still doubling — this may be a real Azure platform ceiling, or it may be a copy-paste value that should scale up like AWS's does.

**Evidence:**

```
AWS features table: "IO Boost | | Add-on: Up to 40,000 IOPS, 1,500 MB/s BW | Add-on: Up to 80,000 IOPS, 2,000 MB/s BW |" (Scale vs Enterprise). Azure features table: "IO Boost | | Add-on: Up to 40,000 IOPS, 1200 MB/s BW | Add-on: Up to 80,000 IOPS, 1200 MB/s BW |" (Scale and Enterprise show the same 1200 MB/s bandwidth figure).
```

**Suggested fix:** Verify with the product/infra team whether Azure Enterprise IO Boost bandwidth is genuinely capped at 1200 MB/s (same as Scale) or should be higher; update the table if it's a copy error.

**Deferral check:** Suspected-only numeric divergence between two plan tiers on the same page, flagged low per C2's guidance to distinguish real contradictions from intentional platform differences that the engine cannot verify against the live product.

---

### 7. /get-started/cloud-exclusive-features / /learn/tiger-cloud/cloud-exclusive-features — placement

**Checklist item:** I2

**Why:** Two pages with identical titles and descriptions about the same topic present different amounts of content (one is missing the comparison table the other has), so a reader who reaches the get-started variant gets a materially thinner version of the same nominal page without any indication a fuller version exists elsewhere.

**Evidence:**

```
Both pages share the exact title ("Cloud-exclusive features") and description ("Learn about the features and capabilities available exclusively in Tiger Cloud"). get-started/cloud-exclusive-features.mdx imports only `CloudExclusiveFeatureDetails`, while learn/tiger-cloud/cloud-exclusive-features.mdx imports both `CloudExclusiveComparison` (a 38-line comparison table) and `CloudExclusiveFeatureDetails`.
```

**Suggested fix:** Either add the `CloudExclusiveComparison` partial to get-started/cloud-exclusive-features.mdx so both pages are consistent, or differentiate the two pages' descriptions to signal that the get-started version is intentionally a lighter summary.

**Deferral check:** Placement/duplicate-purpose findings are agent-judged per the I section deferral note and kept at low/medium severity; this is a low-severity content-completeness gap between two same-purpose pages in different tabs, not a broken link or formatting issue.

---

### 8. /integrate/connectors/destination/tigerlake — version-and-availability

**Checklist item:** B1

**Why:** Feature availability in this docs set is otherwise always expressed as a major PostgreSQL/TimescaleDB version (for example "PostgreSQL 17" or "TimescaleDB 2.13+"); requiring a specific minor/patch release (17.6) is unusual and is not corroborated anywhere else in the corpus, so it reads as a possible transcription error (for example, meant to say "PostgreSQL 17" or a specific Tiger Cloud platform version) rather than a genuine patch-level dependency.

**Evidence:**

```
Limitations section: "Service requires {C.PG} 17.6 and above is supported."
```

**Suggested fix:** Verify with the TigerLake/product team whether the real requirement is PostgreSQL major version 17 (as used elsewhere in the docs) or a specific patch release, and correct the wording accordingly.

**Deferral check:** This flags a suspected-inaccurate version claim for verification against the product, per the B1 mechanical-probe pattern; it does not assert the claim is wrong, and no other page states this requirement to check for the mechanical C1/C2 cross-page contradiction pattern.

---

### 9. /integrate/data-ingestion-streaming/litmus-edge / /integrate/data-ingestion-streaming/kepware-kepserverex / /integrate/data-ingestion-streaming/node-red — code-identifiers

**Checklist item:** F6

**Why:** Both `timescaledb.*` and `tsdb.*` are real, working WITH-clause option names, so this is not a broken example, but it is an inconsistent choice of the current recommended syntax across near-identical sibling integration guides, which can read as contradictory to someone comparing two of these pages.

**Evidence:**

```
These three pages create hypertables with `WITH (timescaledb.hypertable, timescaledb.chunk_interval = '7 days', ...)` (Litmus Edge also sets `timescaledb.segmentby = '...'`). Sibling integration guides created around the same time (`/integrate/data-ingestion-streaming/emqx`, `/integrate/data-ingestion-streaming/hivemq`, `/integrate/data-engineering-etl/apache-kafka`, `/integrate/data-engineering-etl/aws-lambda`, `/integrate/data-engineering-etl/amazon-sagemaker`, `/integrate/data-engineering-etl/supabase`, `/integrate/observability-alerting/telegraf`) all use `WITH (tsdb.hypertable = true, tsdb.partition_column = '...', tsdb.chunk_interval = '...')` instead, matching the reference page `/reference/timescaledb/hypertables/create_table` and the `tsdb.*` example in AGENTS.md/CLAUDE.md.
```

**Suggested fix:** Update these three pages to use the `tsdb.hypertable` / `tsdb.partition_column` / `tsdb.chunk_interval` / `tsdb.segmentby` naming used by the reference docs and the majority of sibling integration guides, for consistency.

**Deferral check:** Both forms are real, currently-supported syntax (this is not the deprecated compress_chunk-style rename Vale's TigerData.CompressionAPIs owns), so this is a cross-page current-syntax consistency judgment call, not a compile error or a Vale-covered literal-vs-constant issue.

---

### 10. /learn/capabilities-and-comparison/understand-capabilities — cross-page-consistency

**Checklist item:** C2

**Why:** Presenting a narrower, lower range (90-95%/95%+) for the same Hypercore storage-reduction claim than the figure used almost everywhere else in the corpus (up to 98%) could read as a different, more conservative number rather than the same fact.

**Evidence:**

```
understand-capabilities.mdx states Hypercore delivers "90-95% storage reduction" (twice) and, in the IoT use-case section, "95%+ storage reduction", while the corpus-wide consensus figure for the same claim (understand-hypercore.mdx, data-lifecycle pages, basic-compression.mdx, setup-hypercore.mdx, get-started/index.mdx) is "up to 98%".
```

**Suggested fix:** Align the two Hypercore bullet points and the IoT use-case bullet in understand-capabilities.mdx to the corpus-standard "up to 98%" storage-reduction figure, or note explicitly that 90-95% is a typical (not maximum) range if that is the intent.

**Deferral check:** Not the accepted single-superlative marketing voice; this is a specific range repeated three times that is lower than the near-universal figure used elsewhere for the identical fact, which C2 asks the agent to adjudicate rather than accept as intentional variation.

---

### 11. /learn/deep-dive/whitepaper — cross-page-consistency

**Checklist item:** C2

**Why:** The whitepaper's compression figure (up to 95%) is stale relative to the "up to 98%" figure used almost everywhere else in the current corpus for the same Hypercore/columnstore compression claim, suggesting the whitepaper wasn't updated when the rest of the docs moved to the higher number.

**Evidence:**

```
whitepaper.mdx: "a hybrid row-columnar storage engine designed to deliver high-performance queries and efficient compression (up to 95%) within PostgreSQL" and "significantly reduce storage footprint (by up to 95%) and improve I/O performance," versus the corpus-standard "up to 98%" used in understand-hypercore.mdx, data-lifecycle pages, get-started/index.mdx, basic-compression.mdx, and setup-hypercore.mdx.
```

**Suggested fix:** Update both instances of "up to 95%" in whitepaper.mdx to "up to 98%" to match the current corpus-wide figure, or confirm with product whether 95% remains the whitepaper's intentionally distinct (e.g., more conservative) figure.

**Deferral check:** Flagged as suspected/low per the N-category deferral (the engine flags suspected staleness, it does not certify current product behavior) combined with C2's cross-page numeric-divergence check.

---

### 12. /reference/configuration — placement-and-scope

**Checklist item:** I3

**Why:** The page's title/description promise a complete configuration reference, but the body is an acknowledged placeholder with no actual settings, defaults, or links — a reader landing here (for example from a search result) gets nothing actionable, while the real GUC content lives at /reference/timescaledb/configuration/gucs.

**Evidence:**

```
The file contains an inline comment `{/* TODO: Flesh out full configuration reference with accurate GUC lists, defaults, and links to TimescaleDB/PostgreSQL docs. */}` and the body consists only of empty section headers ("PostgreSQL settings", "TimescaleDB settings", "Tiger Cloud settings", "Query planning & execution") with no content under any of them, while the page's own description promises "PostgreSQL and TimescaleDB configuration settings."
```

**Suggested fix:** Either flesh out this page per its own TODO, or replace it with a short redirect-style page pointing to /reference/timescaledb/configuration and /reference/timescaledb/configuration/gucs until the full content exists.

**Deferral check:** This is agent-judged scope drift (I3: body doesn't deliver on title/description), not a build error — the page compiles fine, it's simply an acknowledged stub masquerading as a reference page.

---

### 13. /reference/timescaledb/hyperfunctions/time-series-utilities/days_in_month — prose-code-agreement

**Checklist item:** K1

**Why:** The prose describes January 2022 but the code example uses a 2021 timestamp; the shown output (31) happens to be correct for January of any year, but the year mismatch between narration and code is still a factual inconsistency a careful reader would notice.

**Evidence:**

```
"Calculate how many days in the month of January 1, 2022:" followed by `SELECT days_in_month('2021-01-01 00:00:00+03'::timestamptz)`
```

**Suggested fix:** Change the code literal to '2022-01-01 00:00:00+03' to match the prose, or change the prose to say 2021.

**Deferral check:** Not a SQL-execution correctness question (the output is right either way) — this is K1, prose stating a different date than the adjacent code block.

---

### 14. /reference/timescaledb/informational-views — coverage-gap

**Checklist item:** None

**Why:** The page tells readers this view is part of the stable public API they should build monitoring on, but unlike its ten siblings there is no reference page describing its columns or sample output, leaving a real documented feature without reference coverage in the one place a reader would look. Pure judgment finding: no checklist pattern names 'missing reference page for a shipped view.'

**Evidence:**

```
The "Stability" section lists `timescaledb_information.stat_chunk_activity` as a stable, public-API view alongside ten other views that each have a linked, dedicated reference page — but stat_chunk_activity is listed as plain text with no link, and no page under informational-views/ documents it (confirmed: it is mentioned only in the changelog at get-started/news/new.mdx, never given its own reference page).
```

**Suggested fix:** Add a reference page for timescaledb_information.stat_chunk_activity (and the chunk_statistics() function mentioned alongside it in the 2.28 changelog entry) under informational-views/, or link the changelog entry from the Stability section as a stand-in until one exists.

**Deferral check:** Not a broken link (no link was made, so the validator has nothing to check) and not a build issue — this is a coverage gap the engine surfaces by cross-referencing the changelog against the reference section's own file listing.

---

### 15. /reference/toolkit/percentile-approximation/tdigest/approx_percentile / /reference/toolkit/percentile-approximation/tdigest/mean / /reference/toolkit/percentile-approximation/tdigest/max_val / /reference/toolkit/percentile-approximation/tdigest/min_val / /reference/toolkit/percentile-approximation/tdigest/num_vals / /reference/toolkit/percentile-approximation/tdigest/total / /reference/toolkit/percentile-approximation/tdigest/rollup — code-identifiers

**Checklist item:** F2

**Why:** Suspected minor naming inconsistency: within the tdigest accessor family, one function names its input parameter differently from the other six, which could confuse a reader using named-argument syntax across functions in the same group.

**Evidence:**

```
approx_percentile.mdx (tdigest) names its TDigest input parameter `tdigest` in both the signature (`tdigest TDigest`) and the table, while every other tdigest accessor (mean, max_val, min_val, num_vals, total, rollup) consistently names the same conceptual parameter `digest`.
```

**Suggested fix:** Consider renaming approx_percentile.mdx's (tdigest) parameter from `tdigest` to `digest` for consistency with its six sibling accessors, if the underlying function's real parameter name is `digest`.

**Deferral check:** Suspected-only, low-confidence pattern flag (no independent product-source check performed for this specific parameter name); not a build/lint issue.

---

