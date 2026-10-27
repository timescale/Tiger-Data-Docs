# Tiger Cloud API reference inputs

The Stainless renderer generates the Tiger Cloud REST reference from these
checked-in files. Builds do not contact Stainless and do not require a
`STAINLESS_API_KEY` or `stl auth login`.

- `openapi.yml` is the Tiger Cloud public REST API spec. It arrives here as
  an automated PR after each release; nothing in this repo pulls it.
- `stainless.yml` controls resource hierarchy, skipped operations, and code
  samples, and is kept in sync with `openapi.yml` by that same PR, via
  `pnpm stainless:sync`
  ([`scripts/sync-stainless-resources.mjs`](../scripts/sync-stainless-resources.mjs)).
