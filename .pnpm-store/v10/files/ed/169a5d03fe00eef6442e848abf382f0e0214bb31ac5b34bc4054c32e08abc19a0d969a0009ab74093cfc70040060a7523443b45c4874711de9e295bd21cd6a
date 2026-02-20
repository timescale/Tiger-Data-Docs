# SDK_PackageTitle API Library

[![NPM version](https://img.shields.io/npm/v/SDK_NPMPackage.svg?label=npm%20(stable))](https://npmjs.org/package/SDK_NPMPackage) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/SDK_NPMPackage)SDK_JSRShield

SDK_ReadmeOpening

SDK_ScreencastURL

SDK_DocumentationReference

SDK_GeneratedByStainless

SDK_MCPReadmeSection

## Installation

SDK_NPMInstallInstructions

SDK_JSRInstallation

## Usage

SDK_APIReference

<!-- prettier-ignore -->
```js
SDK_Usage
```

SDK_StreamingUsage

### Request & Response types

This library includes TypeScript definitions for all request params and response fields. You may import and use them like so:

<!-- prettier-ignore -->
```ts
SDK_TypeScriptUsage
```

Documentation for each method, request param, and response field are available in docstrings and will appear on hover in most modern editors.

SDK_FileUploadsUsage

SDK_BinaryUploadsUsage

## Handling errors

When the library is unable to connect to the API,
or if the API returns a non-success status code (i.e., 4xx or 5xx response),
a subclass of `APIError` will be thrown:

<!-- prettier-ignore -->
```ts
SDK_ErrorsExample
```

Error codes are as follows:

| Status Code | Error Type                 |
| ----------- | -------------------------- |
| 400         | `BadRequestError`          |
| 401         | `AuthenticationError`      |
| 403         | `PermissionDeniedError`    |
| 404         | `NotFoundError`            |
| 422         | `UnprocessableEntityError` |
| 429         | `RateLimitError`           |
| >=500       | `InternalServerError`      |
| N/A         | `APIConnectionError`       |

### Retries

Certain errors will be automatically retried SDK_DefaultMaxRetries times by default, with a short exponential backoff.
Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict,
429 Rate Limit, and >=500 Internal errors will all be retried by default.

You can use the `maxRetries` option to configure or disable this:

<!-- prettier-ignore -->
```js
SDK_RetriesExample
```

### Timeouts

Requests time out after SDK_HumanReadableDefaultTimeout by default. You can configure this with a `timeout` option:

<!-- prettier-ignore -->
```ts
SDK_TimeoutsExample
```

On timeout, an `APIConnectionTimeoutError` is thrown.

Note that requests which time out will be [retried twice by default](#retries).

SDK_Pagination

SDK_DefaultHeaders

## Advanced Usage
SDK_TreeShakingDocs
### Accessing raw Response data (e.g., headers)

The "raw" `Response` returned by `fetch()` can be accessed through the `.asResponse()` method on the `APIPromise` type that all methods return.
This method returns as soon as the headers for a successful response are received and does not consume the response body, so you are free to write custom parsing or streaming logic.

You can also use the `.withResponse()` method to get the raw `Response` along with the parsed data.
Unlike `.asResponse()` this method consumes the body, returning once it is parsed.

<!-- prettier-ignore -->
```ts
SDK_RawResponseExample
```

### Logging

> [!IMPORTANT]
> All log messages are intended for debugging only. The format and content of log messages
> may change between releases.

#### Log levels

The log level can be configured in two ways:

1. Via the `SDK_PackageLoggingEnvVar` environment variable
2. Using the `logLevel` client option (overrides the environment variable if set)

```ts
import SDK_PackageName from 'SDK_NPMPackage';

const SDK_ClientName = new SDK_PackageName({
  logLevel: 'debug', // Show all log messages
});
```

Available log levels, from most to least verbose:

- `'debug'` - Show debug messages, info, warnings, and errors
- `'info'` - Show info messages, warnings, and errors
- `'warn'` - Show warnings and errors (default)
- `'error'` - Show only errors
- `'off'` - Disable all logging

At the `'debug'` level, all HTTP requests and responses are logged, including headers and bodies.
Some authentication-related headers are redacted, but sensitive data in request and response bodies
may still be visible.

#### Custom logger

By default, this library logs to `globalThis.console`. You can also provide a custom logger.
Most logging libraries are supported, including [pino](https://www.npmjs.com/package/pino), [winston](https://www.npmjs.com/package/winston), [bunyan](https://www.npmjs.com/package/bunyan), [consola](https://www.npmjs.com/package/consola), [signale](https://www.npmjs.com/package/signale), and [@std/log](https://jsr.io/@std/log). If your logger doesn't work, please open an issue.

When providing a custom logger, the `logLevel` option still controls which messages are emitted, messages
below the configured level will not be sent to your logger.

```ts
import SDK_PackageName from 'SDK_NPMPackage';
import pino from 'pino';

const logger = pino();

const SDK_ClientName = new SDK_PackageName({
  logger: logger.child({ name: 'SDK_PackageName' }),
  logLevel: 'debug', // Send all messages to pino, allowing it to filter
});
```

### Making custom/undocumented requests

This library is typed for convenient access to the documented API. If you need to access undocumented
endpoints, params, or response properties, the library can still be used.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can use `SDK_ClientName.get`, `SDK_ClientName.post`, and other HTTP verbs.
Options on the client, such as retries, will be respected when making these requests.

```ts
await SDK_ClientName.post('/some/path', {
  body: { some_prop: 'foo' },
  query: { some_query_arg: 'bar' },
});
```

#### Undocumented request params

To make requests using undocumented parameters, you may use `// @ts-expect-error` on the undocumented
parameter. This library doesn't validate at runtime that the request matches the type, so any extra values you
send will be sent as-is.

```ts
SDK_ExampleClientMethodName({
  // ...
  // @ts-expect-error baz is not yet public
  baz: 'undocumented option',
});
```

For requests with the `GET` verb, any extra params will be in the query, all other requests will send the
extra param in the body.

If you want to explicitly send an extra argument, you can do so with the `query`, `body`, and `headers` request
options.

#### Undocumented response properties

To access undocumented response properties, you may access the response object with `// @ts-expect-error` on
the response object, or cast the response object to the requisite type. Like the request params, we do not
validate or strip extra properties from the response from the API.

### Customizing the fetch client

By default, this library expects a global `fetch` function is defined.

If you want to use a different `fetch` function, you can either polyfill the global:

```ts
import fetch from 'my-fetch';

globalThis.fetch = fetch;
```

Or pass it to the client:

```ts
import SDK_PackageName from 'SDK_NPMPackage';
import fetch from 'my-fetch';

const SDK_ClientName = new SDK_PackageName({ fetch });
```

### Fetch options

If you want to set custom `fetch` options without overriding the `fetch` function, you can provide a `fetchOptions` object when instantiating the client or making a request. (Request-specific options override client options.)

```ts
import SDK_PackageName from 'SDK_NPMPackage';

const SDK_ClientName = new SDK_PackageName({
  fetchOptions: {
    // `RequestInit` options
  },
});
```

#### Configuring proxies

To modify proxy behavior, you can provide custom `fetchOptions` that add runtime-specific proxy
options to requests:

<img src="https://raw.githubusercontent.com/stainless-api/sdk-assets/refs/heads/main/node.svg" align="top" width="18" height="21"> **Node** <sup>[[docs](https://github.com/nodejs/undici/blob/main/docs/docs/api/ProxyAgent.md#example---proxyagent-with-fetch)]</sup>

```ts
import SDK_PackageName from 'SDK_NPMPackage';
import * as undici from 'undici';

const proxyAgent = new undici.ProxyAgent('http://localhost:8888');
const SDK_ClientName = new SDK_PackageName({
  fetchOptions: {
    dispatcher: proxyAgent,
  },
});
```

<img src="https://raw.githubusercontent.com/stainless-api/sdk-assets/refs/heads/main/bun.svg" align="top" width="18" height="21"> **Bun** <sup>[[docs](https://bun.sh/guides/http/proxy)]</sup>

```ts
import SDK_PackageName from 'SDK_NPMPackage';

const SDK_ClientName = new SDK_PackageName({
  fetchOptions: {
    proxy: 'http://localhost:8888',
  },
});
```

<img src="https://raw.githubusercontent.com/stainless-api/sdk-assets/refs/heads/main/deno.svg" align="top" width="18" height="21"> **Deno** <sup>[[docs](https://docs.deno.com/api/deno/~/Deno.createHttpClient)]</sup>

```ts
import SDK_PackageName from 'SDK_DenoSpecifier';

const httpClient = Deno.createHttpClient({ proxy: { url: 'http://localhost:8888' } });
const SDK_ClientName = new SDK_PackageName({
  fetchOptions: {
    client: httpClient,
  },
});
```

## Frequently Asked Questions

## Semantic versioning

This package generally follows [SemVer](https://semver.org/spec/v2.0.0.html) conventions, though certain backwards-incompatible changes may be released as minor versions:

1. Changes that only affect static types, without breaking runtime behavior.
2. Changes to library internals which are technically public but not intended or documented for external use. _(Please open a GitHub issue to let us know if you are relying on such internals.)_
3. Changes that we do not expect to impact the vast majority of users in practice.

We take backwards-compatibility seriously and work hard to ensure you can rely on a smooth upgrade experience.

We are keen for your feedback; please open an [issue](SDK_RepoURL/issues) with questions, bugs, or suggestions.

## Requirements

TypeScript >= 4.9 is supported.

The following runtimes are supported:

SDK_SupportedRuntimes

Note that React Native is not supported at this time.

If you are interested in other runtime environments, please open or upvote an issue on GitHub.

## Contributing

See [the contributing documentation](./CONTRIBUTING.md).
