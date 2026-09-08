# Integration use cases

## Transactional notification

Send an order, payment or account event with a business-derived idempotency key. Use template keys and metadata references rather than embedding large or sensitive objects.

## Security alert

Use high priority, mandatory policy only when granted by platform policy, short expiry, acknowledgement requirements and multiple channels. Do not allow external clients to mark arbitrary notifications as mandatory.

## Scheduled reminder

Set `scheduled_for` and `expires_at`. The existing task layer releases and expires notifications; the SDK only submits and monitors the command.

## Localised templates

Create template variants by key, version, locale and channel. Preview with sanitized context before activating. Keep presentation logic in templates, not every application backend.

## Bulk campaign

Use bounded batches for creation and durable bulk mutations for recipient state changes. Respect quotas, recipient preferences, suppression and provider cost controls.

## Push lifecycle

Register a token when the device obtains permission, rotate on installation/token change, revoke at logout or permission withdrawal, and handle provider receipt reconciliation through the service.

## Realtime application dashboard

Use the external developer WebSocket route to monitor application-owned notification state and delivery events. Persist cursors and deduplicate events.

## Realtime end-user inbox

The developer backend issues a recipient-bound ticket after authenticating its own user. The frontend connects to the recipient route and can only read or mutate that recipient's notification state.

## Attachments

Upload through the media service first, then attach a media reference. Delivery remains suppressed while required scanning is incomplete or infected.

## Digest

Build scheduled hourly/daily/weekly collections for recipients who enabled digests. Monitor the digest batch rather than sending each item synchronously.

## Audit and compliance

Use public IDs, request IDs, correlation IDs, delivery receipts and redacted attempts. Apply retention and data-subject deletion through the service's existing task and policy layer.
