# Information Architecture

```
get-started/ (hello world - one for each section)
├── index.mdx (Welcome + choose your path)
├── quickstart-5-minutes.mdx (Hello World - Tiger Cloud/TimescaleDB)
├── create-service.mdx (Tiger Cloud/TimescaleDB setup)
├── connect-your-app.mdx (Connection guide exisiting to TC/TimescaleDB)
└── next-steps.mdx (Where to go from here)
└── new.mdx (changelog)

/learn/ (learn/understand a thing)
├── index.mdx (Learning overview:level of content)
│
├── fundamentals/ (start here)
│   ├── your-first-hypertable.mdx
│   ├── querying-time-series-data.mdx
│   ├── understanding-chunks.mdx
│   └── basic-compression.mdx
│   partitioning/ (sort by capabilities)
│ 
├── deep-dive/advanced topics/ 
TODO:add more advanced topics here
│   ├── whitepaper.mdx
│   ├── ...
│   └── ...
│ 
├── examples/
│   ├── build-iot-dashboard.mdx
│   ├── financial-tick-data.mdx
│   ├── log-aggregation.mdx
│   └── continuous-aggregates-intro.mdx
│
├── time-series-analytics/ (TODO: Adjust title)
│   ├── build-iot-dashboard.mdx
│   ├── financial-tick-data.mdx
│   ├── log-aggregation.mdx
│   └── continuous-aggregates-intro.mdx
│
├── production-patterns/ 
	TODO: review structure to ensure it fits in the larger section
│   ├── multi-tenant-saas.mdx
	()
│   ├── real-time-alerting.mdx
│   └── high-availability-setup.mdx

/build/ (do a thing)
(NOTE: this section should be titled by FEATURE NAME: capability)
├── index.mdx (Find your solution)

├── time-series/ (Core operations)
	partitioning / hypertables
	** rename to better fit the subsection**
	** basic features / data management **
│   ├── create-hypertable.mdx
│   ├── choose-chunk-intervals.mdx
│   ├── handle-late-arriving-data.mdx
│   ├── query-time-ranges-efficiently.mdx
│   ├── downsample-data.mdx
│   └── create-time-buckets.mdx
│
├── continuous-aggregates/ (CAGG operations)
	rollups / continuous aggregates
│   ├── create-continuous-aggregate.mdx
│   ├── fix-data-gaps.mdx (high-priority from user feedback)
│   ├── build-hierarchical-aggregates.mdx
│   ├── refresh-aggregates-manually.mdx
│   ├── troubleshoot-refresh-lag.mdx
│   └── optimize-cagg-performance.mdx
│
├── columnar-storage / hypercore (Storage optimization)
	**NOTE: Columnar storage NOT compression storage**
	when people thought compression, save storage but slower: column store is LESS storage but faster. Capability is column store (aka hypercore)
│   ├── enable-compression.mdx
│   ├── choose-segmentby-columns.mdx
│   ├── recompress-chunks.mdx
│   ├── update-compressed-data.mdx
│   └── configure-retention-policies.mdx

TIERED STORAGE v. TIGER LAKE
- tiered storage
│
├── performance optimization 101
│   ├── diagnose-slow-queries.mdx
│   ├── optimize-query-performance.mdx
│   ├── tune-memory-settings.mdx
│   ├── create-efficient-indexes.mdx
│   └── batch-insert-data.mdx
│
├── cost-optimization/ (Cost management)
│   ├── reduce-storage-costs.mdx
	- ** link to tiered storage
│   ├── monitor-your-bill.mdx
│   ├── right-size-your-instance.mdx
│   └── pricing-calculator.mdx
│
├── migration/ (Data migration)
	*** ? do we want this and the migrate section below | potential duplicate?***
│   ├── migrate-from-postgresql.mdx
│   ├── migrate-from-influxdb.mdx
│   ├── migrate-from-mongodb.mdx
│   ├── migrate-from-mysql.mdx
│   ├── live-migration-setup.mdx
│   └── import-csv-data.mdx
│
 operations/ (Production ops)
    ├── setup-monitoring.mdx
    ├── configure-backups.mdx
    ├── use-forks-for-dev.mdx
    ├── implement-high-availability.mdx
    └── handle-failover.mdx
│
└── Tips and Tricks 
	**TODO: reference clickhouse: data analysis how this is connected together: is this better suited under BUILD?**
    ├── primary 
    
│
└── cookbooks/ (step-by-step how-to)
	(**can be interlinked with above sections**)
    ├── how-to-analyze-blockchain-data.mdx
    ├── how-to-energy-consumption-analysis.mdx
    ├── how-to-transport-data-analytics.mdx
    └── how-to-predictive-maintenance.mdx
    
Operate
├── cost-optimization/ (Cost management)
│   ├── reduce-storage-costs.mdx
	- ** link to tiered storage
│   ├── monitor-your-bill.mdx
│   ├── right-size-your-instance.mdx
│   └── pricing-calculator.mdx
├── Security
├── Compatibilty Matrix 
├── Manage / Maintenance and updates
	


/migrate/ (move to tiger data)
├── index.mdx (find your migration from)
│
├── migrate from/ 
│   ├── mongodb
│   ├── postgres
│   ├── clickhouse
│   ├── cockroach
│   ├── planetscale
│   └── ....

/integrate/ (work with tiger data)
(TODO: flesh out the integrations section further)
├── index.mdx (integrate in your ecosystem)
│
├── Type of integration/ (category by jobs to be done)
│   ├── tool 1
│   ├── tool 2 
│   └── ....

/reference/ (API reference + architecture)
├── index.mdx (Reference overview)
│ - ** double link whitepaper ** 
│
├── timescaledb/ (Core SQL functions)
│   ├── hypertables/
│   │   ├── create_hypertable.mdx
│   │   ├── drop_chunks.mdx
│   │   ├── show_chunks.mdx
│   │   └── ... (all hypertable functions)
│   ├── compression/
│   │   ├── compress_chunk.mdx
│   │   ├── decompress_chunk.mdx
│   │   ├── add_compression_policy.mdx
│   │   └── ... (all compression functions)
│   ├── continuous-aggregates/
│   │   ├── create_materialized_view.mdx
│   │   ├── refresh_continuous_aggregate.mdx
│   │   ├── add_continuous_aggregate_policy.mdx
│   │   └── ... (all CAGG functions)
│   ├── hypercore/
│   │   ├── add_columnstore_policy.mdx
│   │   ├── convert_to_columnstore.mdx
│   │   └── ... (all hypercore functions)
│   ├── hyperfunctions/
│   │   ├── time_bucket.mdx
│   │   ├── time_bucket_gapfill.mdx
│   │   └── ... (all hyperfunctions)
│   ├── data-retention/
│   │   └── add_retention_policy.mdx
│   ├── jobs-automation/
│   │   ├── add_job.mdx
│   │   └── alter_job.mdx
│   └── informational-views/
│       └── ... (all system views)
│
├── toolkit/ (TimescaleDB Toolkit functions)
│   ├── candlestick_agg/
│   ├── counter_agg/
│   ├── gauge_agg/
│   ├── downsampling/
│   ├── percentile-approximation/
│   ├── state-tracking/
│   ├── statistical-analysis/
│   └── time_weight/
│
│
├── pg_textsearch/ 
	** Maybe: TBD : TJ**
│   ├── TODO
│   ├── TODO
│   └── TODO
│
├── pgvectorscale/ (Vector search)
	** Maybe: TBD : Maintenace Mode**
│   ├── create_index.mdx
│   ├── index_parameters.mdx
│   └── query_parameters.mdx
│
├── tiger-cloud-api/ (REST API)
│   ├── overview.mdx
│   ├── authentication.mdx
│   ├── services/
│   ├── read-replica-sets/
│   └── vpcs/
│
├── configuration/
│   ├── postgresql-settings.mdx
│   ├── timescaledb-settings.mdx
│   └── tiger-cloud-settings.mdx
|  └──Timescale: query planning / execution
│
└── glossary.mdx

/deploy/
├── index.mdx (Choose your deployment)
├── comparison.mdx (Side-by-side comparison)
│
├── tiger-cloud/ (Managed cloud)
│   ├── overview.mdx
│   ├── get-started/
│   │   ├── create-service.mdx
│   │   └── run-queries-console.mdx
│   ├── configuration/
│   │   └── tune-your-service.mdx
│   ├── data-security/
│   │   ├── backup.mdx
│   │   ├── restore-pitr.mdx
│   │   ├── high-availability.mdx
│   │   └── read-scaling.mdx
│   ├── secure-access/
│   │   ├── vpc-peering.mdx
│   │   ├── ip-allow-list.mdx
│   │   └── ssl-configuration.mdx
│   ├── monitoring/
│   │   ├── console-metrics.mdx
│   │   ├── export-to-datadog.mdx
│   │   ├── export-to-prometheus.mdx
│   │   └── alerting.mdx
│   ├── storage/
│   │   ├── tiered-storage.mdx
│   │   └── query-tiered-data.mdx
│   ├── pricing/
│   │   ├── pricing-model.mdx (FIX: user reported errors)
│   │   └── account-management.mdx
│   └── troubleshooting.mdx
│
├── self-hosted/ (Self-managed)
│   ├── overview.mdx
│   ├── *** license: check for update (Github: timescaledb, codebase feature/tsl in license, Claude feature defined under TSL, most und)
│   ├── install/
│   │   ├── linux.mdx
│   │   ├── docker.mdx
│   │   ├── kubernetes.mdx
│   │   └── macos.mdx
│   ├── configuration/
│   │   └── tune-deployment.mdx
│   ├── operations/
│   │   ├── backup-restore.mdx
│   │   ├── high-availability.mdx
│   │   └── upgrades.mdx
│   └── troubleshooting.mdx
│
└── mst/ (Managed Service for TimescaleDB)
    ├── overview.mdx
    ├── get-started.mdx
    ├── configuration.mdx
    ├── monitoring.mdx
    └── billing.mdx
