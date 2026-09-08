# Idempotency, retries and concurrency

## Idempotency

Every mutation marked `idempotency_required` in `contract/operations.json` must use an `Idempotency-Key`. Generate the key from the developer's stable business operation, not a new random value on each retry.

Good examples:

```text
order-4738-shipped-v1
password-reset-user-992-attempt-4
invoice-2026-0042-due-reminder
```

The server namespaces keys by verified tenant, application and client identity. Reusing the same key with different semantic input should return a conflict.

## Automatic retry

Retry GET/HEAD/OPTIONS requests and mutations that retain the exact idempotency key when the failure is transport-level or has status:

```text
408, 425, 429, 500, 502, 503, 504
```

Use exponential backoff with full jitter, honour `Retry-After`, and cap attempts. Do not automatically retry validation, authentication, authorization, not-found, state-conflict or precondition failures.

## Optimistic concurrency

When updating or cancelling versioned resources, send the expected version using `If-Match` and/or the operation's `expected_version` field. On `412`, reload the resource and decide whether the business action is still valid.
