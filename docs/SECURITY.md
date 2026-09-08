# Security

The SDK follows a fail-closed client-side security model while treating the server as the authority for authentication and authorization.

## Trust boundaries

- Authentication service: establishes tenant/application/service identity and issues access tokens.
- Notification resource server: verifies token validity, audience, tenant/application status, scopes and resource ownership.
- SDK: transports the token and prevents unsafe authority overrides; it does not authenticate tenants itself.

## Client controls

- HTTPS is mandatory outside localhost.
- Python cannot disable certificate verification for non-local hosts.
- Reference transports reject redirects, preventing bearer-token forwarding through HTTP redirects.
- `Authorization`, tenant/application authority headers, cookies, host and framing headers are protected from custom overrides.
- Request and response bodies are bounded.
- Timeouts and bounded attempts are mandatory.
- Mutations retry only when protected by an idempotency key.
- The client validates documented success statuses and treats unexpected 2xx statuses as protocol drift.
- Tenant authority is not an SDK input.
- Application authority is only a canonical path selector on server-defined application routes.
- User-owned routes bind `recipient_identifier` into the URL.
- Group names are validated before transmission.

## Sensitive data

Do not put access tokens, refresh tokens, client secrets, cookies, private keys or provider credentials into notification payload metadata, default headers, logs or exception telemetry.
