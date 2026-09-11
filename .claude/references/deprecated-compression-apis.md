# Deprecated compression APIs

The legacy compression API was deprecated in {C.TIMESCALE_DB} 2.18.0 (and `recompress_chunk()` earlier, in 2.14.0). The old names still work as backwards-compat aliases, but **must not appear in new Tiger Data Docs content** — neither in prose, SQL, CLI examples, connector configs, dbt models, screenshots, nor anywhere else. If you're adapting from a vendor doc, source URL, or older internal page that still uses the old names, translate as you write.

This file is the canonical reference. CLAUDE.md, AGENTS.md, and the docs-authoring skills all point here.

## Verified mapping

Verified against the TimescaleDB source repository (`/Users/anastasiia/Timescale/timescaledb`) — specifically `sql/maintenance_utils.sql`, `sql/policy_api.sql`, `sql/size_utils.sql`, `src/with_clause/create_table_with_clause.c`, and CHANGELOG.md 2.18.0 / 2.14.0:

| Deprecated (do not use)                 | Current (use this)                  | Notes |
|-----------------------------------------|-------------------------------------|-------|
| `compress_chunk(<chunk>)`               | `convert_to_columnstore(<chunk>)`   | 2.18.0 |
| `decompress_chunk(<chunk>)`             | `convert_to_rowstore(<chunk>)`      | 2.18.0 |
| `recompress_chunk(<chunk>)`             | `convert_to_columnstore(<chunk>)`   | 2.14.0; superseded again 2.18.0 |
| `add_compression_policy(...)`           | `add_columnstore_policy(...)`       | Same params |
| `remove_compression_policy(...)`        | `remove_columnstore_policy(...)`    | Same params |
| `chunk_compression_stats(...)`          | `chunk_columnstore_stats(...)`      | Same params |
| `hypertable_compression_stats(...)`     | `hypertable_columnstore_stats(...)` | Same params |
| View `compression_settings`            | View `hypertable_columnstore_settings` | Deprecated in 2.24.0; no bare `columnstore_settings` view exists |
| View `chunk_compression_settings`       | View `chunk_columnstore_settings`   | Same columns |
| View `hypertable_compression_settings`  | View `hypertable_columnstore_settings` | Same columns |
| `timescaledb.compress = true`           | `timescaledb.enable_columnstore = true` | Table option |
| `timescaledb.compress_orderby`          | `timescaledb.orderby`               | Table option |
| `timescaledb.compress_segmentby`        | `timescaledb.segmentby`             | Table option |
| Prose: "compress / decompress the chunk", "compression policy", "compressed data" | Prose: "convert to the columnstore / rowstore", "columnstore policy", "data in the columnstore" — use `{C.COLUMNSTORE}` / `{C.HYPERCORE}` where they apply | |

## Explicitly NOT deprecated

Leave these alone if the source uses them:

- `timescaledb.compress_chunk_time_interval` is still the current option name. (`timescaledb.compress_chunk_interval` is a shorter alias, not a replacement.)
- `timescaledb.compress_sparse_index` is still accepted as an alias for `timescaledb.compress_index`.

## Verification grep

Before saving a page, grep for any remaining deprecated names:

```bash
grep -nE 'compress_chunk\(|decompress_chunk\(|recompress_chunk\(|add_compression_policy|remove_compression_policy|chunk_compression_stats|hypertable_compression_stats|compression_settings|timescaledb\.compress[[:space:]]*=|timescaledb\.compress_orderby|timescaledb\.compress_segmentby' <path-to-file>
```

Expected output: nothing. Any hit must be rewritten using the table above before the page is considered done.