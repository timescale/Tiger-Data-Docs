# SDK_PackageTitle API library

<!-- prettier-ignore -->
[![PyPI version](https://img.shields.io/pypi/v/SDK_PythonPackageName.svg?label=pypi%20(stable))](https://pypi.org/project/SDK_PythonPackageName/)

SDK_ReadmeOpening

SDK_ScreencastURL

SDK_GeneratedByStainless

SDK_MCPReadmeSection

## Documentation

SDK_DocumentationCallout SDK_APIReferenceCallout

## Installation

SDK_PythonPackageInstallInstructions

## Usage

SDK_APIReferenceCallout

```python
SDK_Usage
```

SDK_AuthenticationDocs

## Async usage

Simply import `SDK_AsyncPackageClassName` instead of `SDK_PackageClassName` and use `await` with each API call:

```python
SDK_AsyncUsage
```

Functionality between the synchronous and asynchronous clients is otherwise identical.

### With aiohttp

By default, the async client uses `httpx` for HTTP requests. However, for improved concurrency performance you may also use `aiohttp` as the HTTP backend.

You can enable this by installing `aiohttp`:

SDK_AioHttpInstallDocs

Then you can enable it by instantiating the client with `http_client=DefaultAioHttpClient()`:

```python
SDK_AioHttpUsage
```

SDK_StreamingUsage

## Using types

Nested request parameters are [TypedDicts](https://docs.python.org/3/library/typing.html#typing.TypedDict). Responses are [Pydantic models](https://docs.pydantic.dev) which also provide helper methods for things like:

- Serializing back into JSON, `model.to_json()`
- Converting to a dictionary, `model.to_dict()`

Typed requests and responses provide autocomplete and documentation within your editor. If you would like to see type errors in VS Code to help catch bugs earlier, set `python.analysis.typeCheckingMode` to `basic`.

SDK_Pagination

SDK_NestedParams

SDK_FileUploadsUsage

## Handling errors

When the library is unable to connect to the API (for example, due to network connection problems or a timeout), a subclass of `SDK_PackageImportName.APIConnectionError` is raised.

When the API returns a non-success status code (that is, 4xx or 5xx
response), a subclass of `SDK_PackageImportName.APIStatusError` is raised, containing `status_code` and `response` properties.

All errors inherit from `SDK_PackageImportName.APIError`.

```python
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

Certain errors are automatically retried SDK_DefaultMaxRetries times by default, with a short exponential backoff.
Connection errors (for example, due to a network connectivity problem), 408 Request Timeout, 409 Conflict,
429 Rate Limit, and >=500 Internal errors are all retried by default.

You can use the `max_retries` option to configure or disable retry settings:

```python
SDK_RetriesExample
```

### Timeouts

By default requests time out after SDK_HumanReadableDefaultTimeout. You can configure this with a `timeout` option,
which accepts a float or an [`httpx.Timeout`](https://www.python-httpx.org/advanced/timeouts/#fine-tuning-the-configuration) object:

```python
SDK_TimeoutsExample
```

On timeout, an `APITimeoutError` is thrown.

Note that requests that time out are [retried twice by default](#retries).

SDK_DefaultHeaders

## Advanced

### Logging

We use the standard library [`logging`](https://docs.python.org/3/library/logging.html) module.

You can enable logging by setting the environment variable `SDK_PackageLoggingEnvVar` to `info`.

```shell
$ export SDK_PackageLoggingEnvVar=info
```

Or to `debug` for more verbose logging.

### How to tell whether `None` means `null` or missing

In an API response, a field may be explicitly `null`, or missing entirely; in either case, its value is `None` in this library. You can differentiate the two cases with `.model_fields_set`:

```py
if response.my_field is None:
  if 'my_field' not in response.model_fields_set:
    print('Got json like {}, without a "my_field" key present at all.')
  else:
    print('Got json like {"my_field": null}.')
```

### Accessing raw response data (e.g. headers)

The "raw" Response object can be accessed by prefixing `.with_raw_response.` to any HTTP method call, e.g.,

```py
SDK_RawResponseExample
```

SDK_WithStreamingResponseReadme

### Making custom/undocumented requests

This library is typed for convenient access to the documented API.

If you need to access undocumented endpoints, params, or response properties, the library can still be used.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can make requests using `SDK_ClientName.get`, `SDK_ClientName.post`, and other
http verbs. Options on the client will be respected (such as retries) when making this request.

```py
import httpx

response = SDK_ClientName.post(
    "/foo",
    cast_to=httpx.Response,
    body={"my_param": True},
)

print(response.headers.get("x-foo"))
```

#### Undocumented request params

If you want to explicitly send an extra param, you can do so with the `extra_query`, `extra_body`, and `extra_headers` request
options.

#### Undocumented response properties

To access undocumented response properties, you can access the extra fields like `response.unknown_prop`. You
can also get all the extra fields on the Pydantic model as a dict with
[`response.model_extra`](https://docs.pydantic.dev/latest/api/base_model/#pydantic.BaseModel.model_extra).

### Configuring the HTTP client

You can directly override the [httpx client](https://www.python-httpx.org/api/#client) to customize it for your use case, including:

- Support for [proxies](https://www.python-httpx.org/advanced/proxies/)
- Custom [transports](https://www.python-httpx.org/advanced/transports/)
- Additional [advanced](https://www.python-httpx.org/advanced/clients/) functionality

```python
SDK_CustomHTTPClientExample
```

You can also customize the client on a per-request basis by using `with_options()`:

```python
SDK_ClientName.with_options(http_client=DefaultHttpxClient(...))
```

### Managing HTTP resources

By default the library closes underlying HTTP connections whenever the client is [garbage collected](https://docs.python.org/3/reference/datamodel.html#object.__del__). You can manually close the client using the `.close()` method if desired, or with a context manager that closes when exiting.

```py
SDK_HTTPClientManagementExample
```

## Versioning

This package generally follows [SemVer](https://semver.org/spec/v2.0.0.html) conventions, though certain backwards-incompatible changes may be released as minor versions:

1. Changes that only affect static types, without breaking runtime behavior.
2. Changes to library internals which are technically public but not intended or documented for external use. _(Please open a GitHub issue to let us know if you are relying on such internals.)_
3. Changes that we do not expect to impact the vast majority of users in practice.

We take backwards-compatibility seriously and work hard to ensure you can rely on a smooth upgrade experience.

We are keen for your feedback; please open an [issue](SDK_RepoURL/issues) with questions, bugs, or suggestions.

### Determining the installed version

If you've upgraded to the latest version but aren't seeing any new features you were expecting then your python environment is likely still using an older version.

You can determine the version that is being used at runtime with:

```py
import SDK_PythonPackageImportName
print(SDK_PythonPackageImportName.__version__)
```

## Requirements

Python 3.9 or higher.

## Contributing

See [the contributing documentation](./CONTRIBUTING.md).
