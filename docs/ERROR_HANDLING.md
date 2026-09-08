# Error handling

The SDK maps transport failures separately from API responses.

| Status | Meaning | Normal action |
|---|---|---|
| 400 | Invalid or malformed request | Correct the payload; do not retry unchanged. |
| 401 | Invalid, expired or revoked credential | Refresh/reacquire once, then fail. |
| 403 | Missing scope or ownership | Fix the OAuth grant or application policy. |
| 404 | Not present in authenticated scope | Treat as absent; do not probe other scopes. |
| 409 | Idempotency or state conflict | Compare the original operation and current state. |
| 412 | Stale expected version | Reload and resolve concurrency. |
| 428 | Required idempotency/precondition missing | Add the required header. |
| 429 | Rate or quota limit | Honour `Retry-After`; reduce load. |
| 503 | Dependency/task boundary unavailable | Retry only under the retry policy. |

Never expose SDK exception details directly to end users. Log request IDs, operation IDs and safe error codes, but redact tokens, recipient content and provider diagnostics.
