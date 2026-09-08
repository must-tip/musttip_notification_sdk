# Generating language clients

Supported configuration profiles:

```text
python, typescript-fetch, go, java, csharp, php, ruby,
kotlin, swift5, rust, dart-dio
```

Example:

```bash
python generator/generate.py java --output generated/java --clean
```

Generation requirements:

1. Pin the OpenAPI Generator version.
2. Generate from `specs/openapi-v1.yaml` only.
3. Preserve `operationId` values.
4. Add an interceptor/middleware for token supply, idempotency, retries, request IDs and redacted logging.
5. Compile, format and test the result.
6. Run conformance tests against the operation catalogue and fixtures.
7. Publish generated packages using your organisation's trusted registry and signing process.

OpenAPI generation covers REST. Realtime support should wrap a maintained WebSocket library and use the language-neutral AsyncAPI envelopes.
