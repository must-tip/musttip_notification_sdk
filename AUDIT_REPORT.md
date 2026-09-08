# SDK Audit Report

## Architecture

The SDK is a contract and transport layer only. It does not create notification models, migrations, Celery tasks, provider adapters, Kafka/NATS clients, tenancy models, authentication models or alternative persistence paths.

The external notification service remains the source of truth for validation, sanitization, authorization, persistence, task orchestration, delivery, retries, receipts, outbox/inbox processing, retention and realtime projection.

## Contract coverage

- 42 versioned REST operations.
- 35 documented realtime client events.
- Three versioned realtime authority boundaries.
- OAuth audience and 20 notification scopes.
- OpenAPI 3.1, AsyncAPI 3.0 and portable JSON Schemas.
- Machine-readable operation, scope, retry, error and security catalogues.

## Language portability

The contract uses HTTPS, JSON, OAuth 2.0, WebSocket, JSON Schema and HMAC-SHA256. Generator profiles are supplied for Python, TypeScript, Go, Java, C#, PHP, Ruby, Kotlin, Swift, Rust and Dart/Dio. Dependency-free Python and TypeScript reference clients are included, together with examples for major backend languages.

## Security controls

- HTTPS required outside loopback development.
- Strict bearer-token validation.
- Tenant and application authority excluded from request ownership controls.
- Idempotency required for every mutation declared by the service contract except safe template preview.
- Stable retry behaviour with `Retry-After` support.
- Bounded request, response and realtime payload handling.
- Duplicate JSON key, non-finite number and prototype-pollution key rejection in reference clients.
- UUID public identifiers and scoped natural keys.
- One-time recipient-ticket subprotocol support.
- HMAC-SHA256 event signing compatible with the existing communication architecture.
- No raw-token, provider, broker, storage or server ORM dependencies in reference runtimes.

## Verification

- 14 Python contract/reference tests passed.
- TypeScript strict compilation passed.
- TypeScript event-signature and strict-JSON runtime conformance passed.
- Python wheel built, installed in an isolated environment and imported successfully.
- TypeScript package tarball built successfully.
- Python, TypeScript, Go, Java, PHP, Ruby, Kotlin, Swift and shell examples compiled or passed syntax validation.
- OpenAPI and AsyncAPI local references resolved.
- JSON Schema fixtures validated.
- Secret/path scan found no container paths, private keys or internal package-index data.

## Unverified integrations

No live authentication server, notification API, WebSocket deployment, database, Redis, Celery worker, provider adapter, Kafka or NATS cluster was available. The C# example was not compiled because the .NET SDK was unavailable. Generated clients were not emitted because `openapi-generator-cli` was unavailable; the generator configurations and orchestration script were validated instead.
