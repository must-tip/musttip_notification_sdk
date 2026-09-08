# SDK architecture

## Contract layer

`specs/` and `contract/` are the cross-language source of truth. They describe operations, scopes, realtime routes, error semantics, retry behaviour, security requirements and signed events.

## Generated clients

`generator/` converts the REST contract into idiomatic language packages. Generation supplies models and endpoint methods; each published package should add organisation-specific token supply, telemetry, redaction and release signing.

## Reference clients

Python and TypeScript reference implementations demonstrate the required transport behaviour without adding notification business logic. They are intentionally small and dependency-free.

## Application integration

The developer backend owns business decisions such as when an order event should generate a notification and which tenant-local recipient identifier to use. The server owns validation, sanitization, persistence, preferences, task orchestration, provider adapters, retries, receipts, outbox/inbox processing and retention.

## Realtime integration

Backend monitoring and frontend recipient inboxes are separate clients with separate principals and subprotocols. A recipient ticket is not an application access token and must never be upgraded into application authority.
