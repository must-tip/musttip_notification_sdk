# REST API use cases

The generated clients expose every operation in `contract/operations.json`.

## Notifications

- Send one notification.
- Send an atomic or best-effort bounded batch.
- List with cursor pagination and scoped filters.
- Synchronise after a sequence cursor.
- Read a notification by public UUID.
- Cancel eligible scheduled/pending notifications.
- Request delivery retry through the existing task layer.
- Read redacted attempts, receipts and interactions.

## Attachments

Register an existing media reference; the notification service does not accept arbitrary filesystem paths. Attachment scanning and deletion are delegated to the existing task and media-storage boundaries.

## Push tokens

Register, rotate and revoke tokens by tenant-local recipient and installation/device identity. Raw token values are write-only and never returned.

## Preferences

Read and update recipient preferences and application-specific preference scopes. Tenant-wide callers must explicitly select an application and hold tenant authority.

## Templates

Create, list, read, update, deactivate and preview versioned templates. Use scoped template keys, locale and channel. Template context is sanitized and cannot establish tenant ownership.

## Bulk mutations

Create durable mark-read, archive or delete operations and poll the mutation public UUID. The existing task handler processes bounded batches.

## Digests

Build and monitor hourly, daily or weekly digest batches, then send, retry or cancel through the command endpoint.

## Realtime tickets

Issue single-use recipient tickets from a trusted backend and consume them only through the versioned realtime recipient route.

## Usage

Retrieve aggregate usage within the authenticated application or an explicitly permitted tenant scope. Usage endpoints must never expose another tenant's recipient content.
