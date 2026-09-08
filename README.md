# Must Tip Notification SDK

Contract-first SDK kit for the versioned external notification API, realtime WebSocket protocol and signed communication events.

The SDK does **not** recreate notification models, delivery tasks, provider adapters, tenancy, authentication or Kafka/NATS logic. It exposes the existing notification service safely to developer backends and their end users.

## What is included

- Canonical OpenAPI 3.1 REST contract with 53 operations, including application-scoped, user-owned, grouped and delete routes.
- Canonical AsyncAPI 3.0 realtime contract for internal, developer-monitoring and external-recipient streams.
- Portable JSON Schemas and machine-readable operation, scope, error, retry and security catalogues.
- OpenAPI Generator profiles for Python, TypeScript, Go, Java, C#, PHP, Ruby, Kotlin, Swift, Rust and Dart.
- Dependency-free Python and TypeScript reference clients.
- HMAC-SHA256 event signing and verification compatible with the existing communication architecture.
- Postman collection and backend examples in major languages.
- Conformance tests, fixtures, production security guidance and integration checklists.

## Canonical endpoints

```text
REST:                     /api/v1/external/notifications/
Developer realtime:       /ws/v1/external/notifications/
Developer-recipient feed: /ws/v1/external/notifications/recipient/
```

Never use an unversioned alias. Tenant ownership is derived only from the verified OAuth principal. Application targeting is token-bound or uses the canonical server-authorized `/applications/{application_id}/...` routes; it is never accepted through authority headers, query parameters, or request-body overrides.

## Fastest integration

1. Register a confidential service OAuth client in the authentication service.
2. Grant access to audience `urn:musttip:notification-service` and only the required notification scopes.
3. Generate the client for the backend language, or use the HTTP contract directly.
4. Send every mutation with a stable `Idempotency-Key`.
5. Store only public UUIDs or scoped natural keys.
6. Use the developer realtime route for backend monitoring.
7. Issue single-use recipient tickets for browser/mobile realtime inboxes; never expose management credentials to frontend code.

See `docs/QUICKSTART.md` and `docs/BACKEND_INTEGRATION.md`.

## Source of truth

- REST operations: `specs/openapi-v1.yaml`
- Realtime protocol: `specs/asyncapi-v1.yaml`
- Language-neutral semantics: `contract/`
- Generated clients: `generator/`
- Reference behaviour: `reference/`

## Compatibility

Version `1.x` permits additive optional fields and new endpoints that preserve existing meaning. Breaking changes require a new REST path and realtime subprotocol version.

### Reproducible SDK and backend verification

From the parent `repo-notification-service` directory:

```bash
.venv/bin/pip install -r must-tip-notification-servic-backend/requirements-dev.txt -r musttip_notification_sdk/requirements-dev.txt
npm --prefix musttip_notification_sdk/reference/typescript ci --ignore-scripts
.venv/bin/pytest -q
bash musttip_notification_sdk/scripts/check.sh
```

The parent pytest configuration collects both projects. The SDK integration test
connects over loopback HTTP to Django, checks authenticated capabilities and
invalid-token rejection, and checks all 53 operation routes. Its OAuth verifier
and policy authorizer use controlled fixtures; this does not validate a deployed
identity provider, task handler, broker, or provider delivery. See
`TEST_EXECUTION.md` for current results and deployment prerequisites.
