/**
 * Shared product/brand and doc constants. Use a single source of truth so
 * renames (e.g. product names) stay consistent across the site.
 *
 * Import from anywhere in src (MDX, Astro, TS):
 *   import * as C from "@constants";
 * Then use as e.g. C.CLOUD_LONG, C.TIMESCALE_DB.
 */

// General

export const PRODUCT_PREFIX = 'Tiger';
export const COMPANY = `${PRODUCT_PREFIX} Data`;
export const COMPANY_URL = 'https://www.tigerdata.com';

/** Canonical display name for the database (use this constant everywhere so it can be changed in one place). */
export const POSTGRESQL = 'PostgreSQL';
/** Alias for POSTGRESQL; used in prose and component strings. */
export const PG = POSTGRESQL;

// Pricing

export const PRICING_PLAN_CAP = 'Pricing plan';
export const PRICING_PLAN = 'pricing plan';
export const SCALE = 'Scale';
export const PERFORMANCE = 'Performance';
export const ENTERPRISE = 'Enterprise';
export const FREE = 'Free';

// Products

export const CLOUD_LONG = `${PRODUCT_PREFIX} Cloud`;
export const LAKE_LONG = `${CLOUD_LONG} Iceberg connector`;
export const LAKE_SHORT = 'Iceberg connector';
export const TIMESCALE_DB = 'TimescaleDB';
export const PRODUCTS_ALL = `${COMPANY} products`;
export const PRODUCTS_CL_DB = `${CLOUD_LONG} and ${TIMESCALE_DB}`;
export const TDB_APACHE = `${TIMESCALE_DB} Apache 2 Edition`;
export const TDB_COMMUNITY = `${TIMESCALE_DB} Community Edition`;
export const SELF_SHORT_CAP = 'Self-hosted';
export const SELF_SHORT = 'self-hosted';
export const SELF_LONG_CAP = `${SELF_SHORT_CAP} ${TIMESCALE_DB}`;
export const SELF_LONG = `${SELF_SHORT} ${TIMESCALE_DB}`;
export const CONSOLE = `${PRODUCT_PREFIX} Console`;
export const CONSOLE_LONG = `${PRODUCT_PREFIX} Console`;
export const CONSOLE_SHORT = 'Console';
export const CLI_LONG = `${PRODUCT_PREFIX} CLI`;
export const CLI_SHORT = 'CLI';
export const REST_LONG = `${PRODUCT_PREFIX} REST API`;
export const REST_SHORT = 'REST API';
export const MCP_LONG = `${PRODUCT_PREFIX} MCP`;
export const MCP_SHORT = `${PRODUCT_PREFIX} MCP`;
export const AGENTS_LONG = `${PRODUCT_PREFIX} Agents for Work`;
export const AGENTS_SHORT = `${PRODUCT_PREFIX} Agent`;
export const AGENTS_CLI = `${AGENTS_SHORT} CLI`;
export const EON_SHORT = 'Eon';
export const EON_LONG = `${PRODUCT_PREFIX} ${EON_SHORT}`;
export const CONSOLE_URL = 'https://console.cloud.tigerdata.com/';
export const MST_LONG = `Managed Service for ${TIMESCALE_DB}`;
export const MST_SHORT = 'MST';
export const MST_CONSOLE_LONG = `${MST_LONG} Console`;
export const MST_CONSOLE_SHORT = `${MST_SHORT} Console`;
export const MST_CONSOLE_URL = 'https://portal.managed.timescale.com/';
export const POPSQL = 'PopSQL';
export const SQL_EDITOR = 'SQL editor';
export const CLOUD_EDITOR = `${CLOUD_LONG} SQL editor`; // A collective name for POPSQL and SQL editor in Console
export const SQL_ASSISTANT_LONG = `${CLOUD_LONG} SQL assistant`;
export const SQL_ASSISTANT_SHORT = 'SQL assistant';
export const POPSQL_URL = 'https://popsql.com/';
export const SKIPSCAN_LONG = `${COMPANY} SkipScan`;
export const SKIPSCAN_SHORT = 'SkipScan';
export const TOOLKIT_LONG = `${TIMESCALE_DB} Toolkit`;
export const TOOLKIT_SHORT = 'Toolkit';
export const PGAI_LONG = `pgai on ${COMPANY}`;
export const PGAI_SHORT = 'pgai';
export const PGVECTORSCALE = 'pgvectorscale';
export const PG_SPOT = 'pgspot';

// Projects

export const PROJECT_LONG = `${CLOUD_LONG} project`;
export const PROJECT_SHORT = 'project';
export const PROJECT_SHORT_CAP = 'Project';
export const ACCOUNT_LONG = `${CLOUD_LONG} account`;
export const ACCOUNT_SHORT = `account`;

// Services

export const TIGER_POSTGRES = `${CLOUD_LONG}`;
export const SERVICE_LONG = `${CLOUD_LONG} service`;
export const SERVICE_SHORT_CAP = 'Service';
export const SERVICE_SHORT = 'service';
export const MST_SERVICE_LONG = `${MST_LONG} service`;
export const MST_SERVICE_SHORT = `${MST_SHORT} service`;
// Features

export const HYPERTABLE_CAP = 'Hypertable';
export const HYPERTABLE = 'hypertable';
export const HYPERCORE_CAP = 'Hypercore';
export const HYPERCORE = 'hypercore';
export const HYPERFUNC_CAP = 'Hyperfunctions';
export const HYPERFUNC = 'hyperfunctions';
export const ROWSTORE_CAP = 'Rowstore';
export const ROWSTORE = 'rowstore';
export const COLUMNSTORE_CAP = 'Columnstore';
export const COLUMNSTORE = 'columnstore';
export const CHUNK_CAP = 'Chunk';
export const CHUNK = 'chunk';
export const CHUNK_SKIPPING_CAP = 'Chunk skipping';
export const CHUNK_SKIPPING = 'chunk skipping';
export const MAT_HYPERTABLE_CAP = `Materialized ${HYPERTABLE}`;
export const MAT_HYPERTABLE = `materialized ${HYPERTABLE}`;
export const CAGG_CAP = 'Continuous aggregate';
export const CAGG = 'continuous aggregate';
export const RTAGG_CAP = 'Real-time aggregate';
export const RTAGG = 'real-time aggregate';
export const TIME_BUCKET_CAP = 'Time bucket';
export const TIME_BUCKET = 'time bucket';
export const HA_REPLICA_CAP = 'High-availability replica';
export const HA_REPLICA = 'high-availability replica';
export const HA_REPLICA_SHORT = 'HA replica';
export const READ_REPLICA_CAP = 'Read replica';
export const READ_REPLICA = 'read replica';
export const JOB_CAP = 'Job';
export const JOB = 'job';
export const PAR_COPY_CAP = 'Parallel copy';
export const PAR_COPY = 'parallel copy';
export const PG_VECTORIZER = 'PgVectorizer';
export const DATA_MODE = 'Data view';
export const OPS_MODE = 'Ops view';
export const VPC = 'VPC';
export const IO_BOOST = 'I/O Boost';
export const PG_CONNECTOR = `source ${PG} connector`;
export const PG_CONNECTOR_CAP = `Source ${PG} connector`;
export const S3_CONNECTOR = `source S3 connector`;
export const S3_CONNECTOR_CAP = `Source S3 connector`;

// URLS

export const WEBSITE_MARKETING = 'www.tigerdata.com';
export const WEBSITE_DOCS = 'https://www.tigerdata.com/docs/';
export const CONTACT_SALES = 'sales@tigerdata.com';
export const CONTACT_COMPANY = 'https://www.tigerdata.com/contact/';
