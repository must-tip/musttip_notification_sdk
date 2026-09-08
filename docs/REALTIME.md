# Realtime SDK contract

## Routes

| Product | Path | Subprotocol |
|---|---|---|
| Internal recipient | `/ws/v1/notifications/` | `musttip.notifications.v1` |
| Developer monitor | `/ws/v1/external/notifications/` | `musttip.external-notifications.v1` |
| Developer recipient | `/ws/v1/external/notifications/recipient/` | `musttip.external-notification-recipient.v1` |

External routes require `protocol_version: 1` in every request envelope.

## Developer monitor

A backend service can subscribe, fetch, synchronise, create, cancel, retry, inspect attempts/receipts, record interactions and read usage according to its scopes. Application credentials receive only their exact application stream. Tenant monitoring requires an explicit verified tenant grant.

## Developer recipient

A frontend end user receives only the exact tenant/application/client/recipient stream represented by a short-lived single-use ticket. It cannot create notifications, inspect attempts, read usage or monitor other recipients.

## Reconnection

1. Keep the last acknowledged sequence or stream cursor.
2. Reconnect with exponential backoff and full jitter.
3. Resubscribe.
4. Call sync with the last cursor.
5. Deduplicate asynchronous events by `event_id`.

## Mutations

Every realtime mutation requires an idempotency key. Preserve the same key across reconnect/retry attempts. Use expected versions for state changes where the service exposes optimistic concurrency.

## Backpressure

Process messages through a bounded queue. If the client cannot keep up, close and reconnect with a cursor rather than allowing unbounded memory growth.
