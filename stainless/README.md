# Tiger Cloud API reference inputs

The Stainless renderer generates the Tiger Cloud REST reference from these
checked-in files. Builds do not contact Stainless and do not require a
`STAINLESS_API_KEY` or `stl auth login`.

- `openapi.yml` comes from
  [`stainless-sdks/tiger-cloud-openapi`](https://github.com/stainless-sdks/tiger-cloud-openapi).
- `stainless.yml` comes from
  [`stainless-sdks/tiger-cloud-api-docs`](https://github.com/stainless-sdks/tiger-cloud-api-docs)
  and controls resource hierarchy, skipped operations, and code samples.

Refresh the API definition with:

```bash
pnpm openapi:update
pnpm build
```

When API resources or operation mappings change, update `stainless.yml` from
the companion docs repository as part of the same change.
