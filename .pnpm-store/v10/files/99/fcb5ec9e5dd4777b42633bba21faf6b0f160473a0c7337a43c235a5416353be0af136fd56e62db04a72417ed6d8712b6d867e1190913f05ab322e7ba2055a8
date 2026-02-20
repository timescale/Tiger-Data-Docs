# SDK_PackageTitle API library

SDK_ReadmeOpening It ships with comprehensive types & docstrings in Yard, RBS, and RBI – [see below](SDK_RepoURL#Sorbet) for usage with Sorbet. The standard library's `net/http` is used as the HTTP transport, with connection pooling via the `connection_pool` gem.

SDK_ScreencastURL

SDK_GeneratedByStainless

SDK_MCPReadmeSection

## Documentation

Documentation for releases of this gem can be found [on RubyDoc](SDK_RubyDocInfoURL).

SDK_DocumentationCallout

SDK_Installation

SDK_Usage

SDK_StreamingUsage

SDK_Pagination

SDK_FileUploadsUsage

### Handling errors

When the library is unable to connect to the API, or if the API returns a non-success status code (i.e., 4xx or 5xx response), a subclass of `SDK_ModuleName::Errors::APIError` will be thrown:

```ruby
SDK_ErrorsExample
```

Error codes are as follows:

SDK_ErrorsTable

### Retries

Certain errors will be automatically retried SDK_DefaultMaxRetries times by default, with a short exponential backoff.

Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict, 429 Rate Limit, >=500 Internal errors, and timeouts will all be retried by default.

You can use the `max_retries` option to configure or disable this:

```ruby
SDK_RetriesExample
```

### Timeouts

By default, requests will time out after SDK_DefaultTimeoutInSeconds seconds. You can use the timeout option to configure or disable this:

```ruby
SDK_TimeoutsExample
```

On timeout, `SDK_ModuleName::Errors::APITimeoutError` is raised.

Note that requests that time out are retried by default.

## Advanced concepts

### BaseModel

All parameter and response objects inherit from `SDK_ModuleName::Internal::Type::BaseModel`, which provides several conveniences, including:

1. All fields, including unknown ones, are accessible with `obj[:prop]` syntax, and can be destructured with `obj => {prop: prop}` or pattern-matching syntax.

2. Structural equivalence for equality; if two API calls return the same values, comparing the responses with == will return true.

3. Both instances and the classes themselves can be pretty-printed.

4. Helpers such as `#to_h`, `#deep_to_h`, `#to_json`, and `#to_yaml`.

### Making custom or undocumented requests

#### Undocumented properties

You can send undocumented parameters to any endpoint, and read undocumented response properties, like so:

Note: the `extra_` parameters of the same name overrides the documented parameters.

```ruby
SDK_UndocumentedProperties
```

#### Undocumented request params

If you want to explicitly send an extra param, you can do so with the `extra_query`, `extra_body`, and `extra_headers` under the `request_options:` parameter when making a request, as seen in the examples above.

#### Undocumented endpoints

To make requests to undocumented endpoints while retaining the benefit of auth, retries, and so on, you can make requests using `client.request`, like so:

```ruby
response = client.request(
  method: :post,
  path: '/undocumented/endpoint',
  query: {"dog": "woof"},
  headers: {"useful-header": "interesting-value"},
  body: {"hello": "world"}
)
```

### Concurrency & connection pooling

The `SDK_ModuleName::Client` instances are threadsafe, but are only are fork-safe when there are no in-flight HTTP requests.

Each instance of `SDK_ModuleName::Client` has its own HTTP connection pool with a default size of 99. As such, we recommend instantiating the client once per application in most settings.

When all available connections from the pool are checked out, requests wait for a new connection to become available, with queue time counting towards the request timeout.

Unless otherwise specified, other classes in the SDK do not have locks protecting their underlying data structure.

## Sorbet

This library provides comprehensive [RBI](https://sorbet.org/docs/rbi) definitions, and has no dependency on sorbet-runtime.

You can provide typesafe request parameters like so:

```ruby
SDK_SorbetParamPassing
```

Or, equivalently:

```ruby
SDK_SorbetParamTrick
```

SDK_SorbetEnums

## Versioning

This package follows [SemVer](https://semver.org/spec/v2.0.0.html) conventions. As the library is in initial development and has a major version of `0`, APIs may change at any time.

This package considers improvements to the (non-runtime) `*.rbi` and `*.rbs` type definitions to be non-breaking changes.

## Requirements

Ruby SDK_RubyMinVersion or higher.

## Contributing

See [the contributing documentation](SDK_RepoAssetURL/CONTRIBUTING.md).
