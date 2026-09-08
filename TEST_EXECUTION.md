# Test Execution

## Passed

```text
pytest -q
14 passed
```

The test suite covers REST operation completeness, URL versioning, idempotency metadata, tenant/application authority exclusion, AsyncAPI routes, local reference resolution, JSON Schema fixtures, realtime envelopes, recipient ticket subprotocols, event signature vectors, tamper rejection, reference-client retry behaviour and generator target coverage.

Additional checks passed:

```text
python -m compileall
TypeScript strict build
TypeScript runtime conformance
Python wheel build and isolated install
TypeScript npm tarball build
Go build
Java compile
PHP syntax check
Ruby syntax check
Kotlin compile
Swift compile
TypeScript example type-check
Shell syntax checks
JSON/YAML parsing
OpenAPI/AsyncAPI local-reference validation
```

## Not run

- Live REST calls against the complete notification service.
- Live OAuth client-credentials and remote-principal verification.
- Live WebSocket and recipient-ticket flows.
- Kafka/NATS event consumption.
- Provider delivery and receipt reconciliation.
- C# compilation because `dotnet` was unavailable.
- Actual OpenAPI client generation because `openapi-generator-cli` was unavailable.

The Python wheel initially could not build with isolated dependency resolution because the execution environment had no package-index access. It was then built successfully with `--no-build-isolation` using the installed Setuptools 82.0.1.
