# Production checklist

- OAuth resource access and minimum scopes approved.
- Separate production tenant/application credential configured.
- Tokens and secrets sourced from Vault.
- TLS certificate validation enabled.
- Gateway and SDK request/response limits aligned.
- Stable idempotency keys designed for every business mutation.
- Timeout and retry budgets fit the calling service SLA.
- Realtime cursors and event deduplication persisted where required.
- Shared rate-limit and quota behaviour tested.
- PII and notification-content logging reviewed.
- Alerts exist for 401/403 spikes, 429, task unavailability, outbox lag, DLQ growth and provider failures.
- Tenant/application isolation tests pass.
- Provider sandbox and failure-mode tests pass.
- Key and client-secret rotation procedures tested.
- Contract checksum pinned in CI.
