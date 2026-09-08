# SDK security requirements

- Require TLS outside loopback development.
- Validate the notification audience and use short-lived access tokens.
- Keep client secrets and signing keys in Vault or equivalent protected storage.
- Never accept request `tenant_id` or `application_id` as ownership authority.
- Never place management credentials in browser/mobile bundles.
- Use one-time recipient tickets for frontend realtime connections.
- Send stable idempotency keys for all mutations.
- Bound request, response, frame, collection and string sizes.
- Reject duplicate JSON keys, prototype-pollution keys and non-finite numbers.
- Store only public UUIDs and scoped natural keys.
- Redact raw push tokens, provider requests/responses, broker headers, object keys, secrets and stack traces.
- Avoid logging full notification bodies unless an approved data-classification policy allows it.
- Use DPoP and/or mTLS for high-assurance tenants when enabled by the authentication service.
- Rotate OAuth secrets, event-signing keys and provider credentials without changing application identifiers.
- Run tenant-isolation tests for list, detail, count, sync, export and realtime paths.
