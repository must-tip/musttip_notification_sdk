# Current verification

See [TEST_EXECUTION.md](TEST_EXECUTION.md) for the 2026-09-08 results and unresolved deployment prerequisites. The earlier audit below is historical.

# SDK Audit Report — 1.1.0

## Architecture

The SDK remains a contract and transport layer only. It does not create notification models, migrations, Celery tasks, provider adapters, Kafka/NATS consumers, tenancy models, authentication models, or alternative persistence paths.

The Must Tip authentication service remains authoritative for tenant/application identity. The notification resource server remains authoritative for token validation, scope checks, tenant/application status, resource ownership, persistence, task orchestration, delivery, retries, receipts, outbox/inbox processing, retention, usage metering and realtime projection.

## Contract coverage

- 53 versioned REST operations synchronized from the current external notification OpenAPI contract.
- Application-scoped, user-owned, grouped and delete notification APIs.
- 35 documented realtime client events and three versioned realtime boundaries.
- OAuth audience `urn:musttip:notification-service` and 21 notification scopes including `notifications.delete`.
- OpenAPI 3.1, AsyncAPI 3.0 and portable JSON Schemas.
- Machine-readable operation, scope, retry, error, resource-server and security catalogues.

## Tenant-security controls

- The SDK has no `tenant_id` configuration field.
- Tenant authority is forbidden in path/query/body authority inputs and in custom headers.
- `Authorization`, `X-Tenant-ID`, `X-Application-ID`, cookies, host/framing and other protected headers cannot be overridden through default or per-request headers.
- Application targeting is accepted only through canonical `/applications/{application_id}/...` paths defined by the server contract.
- User-owned routes bind both application and recipient identifiers in the URL.
- Scoped client views (`for_application`, `for_user`) reduce accidental cross-application/user calls while server authorization remains authoritative.
- The SDK treats bearer tokens as opaque credentials and does not trust unverified JWT claims to establish tenant membership.

## Transport controls

- HTTPS is required outside loopback development.
- Python TLS verification cannot be disabled for non-local endpoints.
- Python and TypeScript reference transports reject HTTP redirects to avoid bearer-token forwarding.
- Request and response payloads are bounded.
- Timeouts, bounded retries and `Retry-After` support are implemented.
- Mutations retry only when protected by idempotency keys.
- Unexpected success statuses are rejected as protocol drift.
- Empty 204 responses are handled without attempting JSON parsing.
- Strict JSON utilities continue rejecting duplicate keys, non-finite numbers and unsafe prototype-pollution keys.

## Packaging/integrity fixes

- Repaired invalid `sdk-manifest.json` that previously contained shell commands after the JSON document.
- Restored the canonical root `generator/` directory from the already-present `examples/generator/` content expected by tests and source manifests.
- Rebuilt Python and TypeScript distributable artifacts at version 1.1.0.

## Verification performed

- `pytest -q`: 22 passed.
- Contract/OpenAPI conformance validator: passed with 53 operations.
- TypeScript strict compilation with TypeScript 5.8.3: passed.
- TypeScript runtime protected-header/scoped-client checks: passed.
- Python wheel built with the installed local build toolchain, installed into an isolated target directory and imported successfully.
- TypeScript npm tarball built successfully.
- OpenAPI/AsyncAPI and machine-readable JSON artifacts parse successfully through the conformance suite.

## Not verified in this environment

No live Must Tip authentication server, notification API, WebSocket deployment, Kafka/NATS cluster, provider adapter, database, Redis or Celery deployment was available. Therefore this audit does not claim live end-to-end authentication/authorization or delivery verification. Those controls are represented by the synchronized server contract and must still be exercised in staging.
