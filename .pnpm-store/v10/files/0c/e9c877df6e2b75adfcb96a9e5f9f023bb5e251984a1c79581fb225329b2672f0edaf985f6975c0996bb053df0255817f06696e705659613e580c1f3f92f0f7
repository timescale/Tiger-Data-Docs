# SDK_PackageTitle API Library

<a href="https://pkg.go.dev/SDK_PackagePath"><img src="https://pkg.go.dev/badge/SDK_PackagePath.svg" alt="Go Reference"></a>

The SDK_PackageTitle library provides convenient access to the SDK_RestAPIName
from applications written in Go.

SDK_GeneratedByStainless

SDK_MCPReadmeSection

## Installation

SDK_ReleasePleaseMarkdownBlockStart

```go
import (
	"SDK_PackagePath" // imported as SDK_PackageName
)
```

SDK_ReleasePleaseMarkdownBlockEnd

Or to pin the version:

SDK_ReleasePleaseMarkdownBlockStart

```sh
go get -u 'SDK_PackagePathWithFullVersionUsingAt'
```

SDK_ReleasePleaseMarkdownBlockEnd

## Requirements

This library requires Go 1.22+.

## Usage

SDK_APIReferenceCallout

```go
SDK_UsageExample
```

### Request fields

All request parameters are wrapped in a generic `Field` type,
which we use to distinguish zero values from null or omitted fields.

This prevents accidentally sending a zero value if you forget a required parameter,
and enables explicitly sending `null`, `false`, `''`, or `0` on optional parameters.
Any field not specified is not sent.

To construct fields with values, use the helpers `String()`, `Int()`, `Float()`, or most commonly, the generic `F[T]()`.
To send a null, use `Null[T]()`, and to send a nonconforming value, use `Raw[T](any)`. For example:

```go
params := FooParams{
	Name: SDK_PackageName.F("hello"),

	// Explicitly send `"description": null`
	Description: SDK_PackageName.Null[string](),

	Point: SDK_PackageName.F(SDK_PackageName.Point{
		X: SDK_PackageName.Int(0),
		Y: SDK_PackageName.Int(1),

		// In cases where the API specifies a given type,
		// but you want to send something else, use `Raw`:
		Z: SDK_PackageName.Raw[int64](0.01), // sends a float
	}),
}
```

### Response objects

All fields in response structs are value types (not pointers or wrappers).

If a given field is `null`, not present, or invalid, the corresponding field
will simply be its zero value.

All response structs also include a special `JSON` field, containing more detailed
information about each property, which you can use like so:

```go
if res.Name == "" {
	// true if `"name"` is either not present or explicitly null
	res.JSON.Name.IsNull()

	// true if the `"name"` key was not present in the response JSON at all
	res.JSON.Name.IsMissing()

	// When the API returns data that cannot be coerced to the expected type:
	if res.JSON.Name.IsInvalid() {
		raw := res.JSON.Name.Raw()

		legacyName := struct{
			First string `json:"first"`
			Last  string `json:"last"`
		}{}
		json.Unmarshal([]byte(raw), &legacyName)
		name = legacyName.First + " " + legacyName.Last
	}
}
```

These `.JSON` structs also include an `Extras` map containing
any properties in the json response that were not specified
in the struct. This can be useful for API features not yet
present in the SDK.

```go
body := res.JSON.ExtraFields["my_unexpected_field"].Raw()
```

### RequestOptions

This library uses the functional options pattern. Functions defined in the
`SDK_PackageOptionName` package return a `RequestOption`, which is a closure that mutates a
`RequestConfig`. These options can be supplied to the client or at individual
requests. For example:

```go
SDK_ClientName := SDK_PackageName.SDK_ClientInitializerName(
	// Adds a header to every request made by the client
	SDK_PackageOptionName.WithHeader("X-Some-Header", "custom_header_info"),
)

SDK_HeadlineMethodName(context.TODO(), ...,
	// Override the header
	SDK_PackageOptionName.WithHeader("X-Some-Header", "some_other_custom_header_info"),
	// Add an undocumented field to the request body, using sjson syntax
	SDK_PackageOptionName.WithJSONSet("some.json.path", map[string]string{"my": "object"}),
)
```

See the [full list of request options](https://pkg.go.dev/SDK_PackagePath/SDK_PackageOptionName).

### Pagination

This library provides some conveniences for working with paginated list endpoints.

You can use `.SDK_GeneralAutoPaginationMethodName()` methods to iterate through items across all pages:

SDK_AutoPaginationExample

Or you can use simple `.List()` methods to fetch a single page and receive a standard response object
with additional helper methods like `.GetNextPage()`, e.g.:

SDK_ManualPaginationExample

### Errors

When the API returns a non-success status code, we return an error with type
`*SDK_PackageName.Error`. This contains the `StatusCode`, `*http.Request`, and
`*http.Response` values of the request, as well as the JSON of the error body
(much like other response objects in the SDK).

To handle errors, we recommend that you use the `errors.As` pattern:

```go
SDK_ErrorsExample
```

When other errors occur, they are returned unwrapped; for example,
if HTTP transport fails, you might receive `*url.Error` wrapping `*net.OpError`.

### Timeouts

Requests do not time out by default; use context to configure a timeout for a request lifecycle.

Note that if a request is [retried](#retries), the context timeout does not start over.
To set a per-retry timeout, use `SDK_PackageOptionName.WithRequestTimeout()`.

```go
SDK_TimeoutsExample
```

### File uploads

Request parameters that correspond to file uploads in multipart requests are typed as
`param.Field[io.Reader]`. The contents of the `io.Reader` will by default be sent as a multipart form
part with the file name of "anonymous_file" and content-type of "application/octet-stream".

The file name and content-type can be customized by implementing `Name() string` or `ContentType()
string` on the run-time type of `io.Reader`. Note that `os.File` implements `Name() string`, so a
file returned by `os.Open` will be sent with the file name on disk.

We also provide a helper `SDK_PackageName.FileParam(reader io.Reader, filename string, contentType string)`
which can be used to wrap any `io.Reader` with the appropriate file name and content type.

SDK_FileUploadsExample

### Retries

Certain errors will be automatically retried SDK_DefaultMaxRetries times by default, with a short exponential backoff.
We retry by default all connection errors, 408 Request Timeout, 409 Conflict, 429 Rate Limit,
and >=500 Internal errors.

You can use the `WithMaxRetries` option to configure or disable this:

```go
SDK_RetriesExample
```


### Accessing raw response data (e.g. response headers)

You can access the raw HTTP response data by using the `option.WithResponseInto()` request option. This is useful when
you need to examine response headers, status codes, or other details.

```go
SDK_RawResponseExample
```

### Making custom/undocumented requests

This library is typed for convenient access to the documented API. If you need to access undocumented
endpoints, params, or response properties, the library can still be used.

#### Undocumented endpoints

To make requests to undocumented endpoints, you can use `SDK_ClientName.Get`, `SDK_ClientName.Post`, and other HTTP verbs.
`RequestOptions` on the client, such as retries, will be respected when making these requests.

```go
var (
    // params can be an io.Reader, a []byte, an encoding/json serializable object,
    // or a "…Params" struct defined in this library.
    params map[string]interface{}

    // result can be an []byte, *http.Response, a encoding/json deserializable object,
    // or a model defined in this library.
    result *http.Response
)
err := SDK_ClientName.Post(context.Background(), "/unspecified", params, &result)
if err != nil {
    …
}
```

#### Undocumented request params

To make requests using undocumented parameters, you may use either the `SDK_PackageOptionName.WithQuerySet()`
or the `SDK_PackageOptionName.WithJSONSet()` methods.

```go
params := FooNewParams{
    ID:   SDK_PackageName.F("id_xxxx"),
    Data: SDK_PackageName.F(FooNewParamsData{
        FirstName: SDK_PackageName.F("John"),
    }),
}
SDK_ClientName.Foo.New(context.Background(), params, SDK_PackageOptionName.WithJSONSet("data.last_name", "Doe"))
```

#### Undocumented response properties

To access undocumented response properties, you may either access the raw JSON of the response as a string
with `result.JSON.RawJSON()`, or get the raw JSON of a particular field on the result with
`result.JSON.Foo.Raw()`.

Any fields that are not present on the response struct will be saved and can be accessed by `result.JSON.ExtraFields()` which returns the extra fields as a `map[string]Field`.

### Middleware

We provide `SDK_PackageOptionName.WithMiddleware` which applies the given
middleware to requests.

```go
func Logger(req *http.Request, next SDK_PackageOptionName.MiddlewareNext) (res *http.Response, err error) {
	// Before the request
	start := time.Now()
	LogReq(req)

	// Forward the request to the next handler
	res, err = next(req)

	// Handle stuff after the request
	end := time.Now()
	LogRes(res, err, start - end)

    return res, err
}

SDK_ClientName := SDK_PackageName.SDK_ClientInitializerName(
	SDK_PackageOptionName.WithMiddleware(Logger),
)
```

When multiple middlewares are provided as variadic arguments, the middlewares
are applied left to right. If `SDK_PackageOptionName.WithMiddleware` is given
multiple times, for example first in the client then the method, the
middleware in the client will run first and the middleware given in the method
will run next.

You may also replace the default `http.Client` with
`SDK_PackageOptionName.WithHTTPClient(SDK_ClientName)`. Only one http client is
accepted (this overwrites any previous client) and receives requests after any
middleware has been applied.

## Semantic versioning

This package generally follows [SemVer](https://semver.org/spec/v2.0.0.html) conventions, though certain backwards-incompatible changes may be released as minor versions:

1. Changes to library internals which are technically public but not intended or documented for external use. _(Please open a GitHub issue to let us know if you are relying on such internals.)_
2. Changes that we do not expect to impact the vast majority of users in practice.

We take backwards-compatibility seriously and work hard to ensure you can rely on a smooth upgrade experience.

We are keen for your feedback; please open an [issue](SDK_RepoURL/issues) with questions, bugs, or suggestions.

## Contributing

See [the contributing documentation](./CONTRIBUTING.md).
