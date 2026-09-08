# REST operation reference

The authoritative operation catalogue is `contract/operations.json`, generated from `specs/openapi-v1.yaml`.

The 1.1.0 contract contains 53 REST operations. Important notification entry points include:

| Operation | Method | Route | Scope |
|---|---|---|---|
| `listNotifications` | GET | `/notifications/` | `notifications.read` |
| `createNotification` | POST | `/notifications/` | `notifications.send` |
| `getNotification` | GET | `/notifications/{public_id}/` | `notifications.read` |
| `deleteNotification` | DELETE | `/notifications/{public_id}/` | `notifications.delete` |
| `listApplicationNotifications` | GET | `/applications/{application_id}/notifications/` | `notifications.read` |
| `createApplicationNotification` | POST | `/applications/{application_id}/notifications/` | `notifications.send` |
| `getApplicationNotification` | GET | `/applications/{application_id}/notifications/{public_id}/` | `notifications.read` |
| `deleteApplicationNotification` | DELETE | `/applications/{application_id}/notifications/{public_id}/` | `notifications.delete` |
| `listOwnedApplicationNotifications` | GET | `/applications/{application_id}/users/{recipient_identifier}/notifications/` | `notifications.read` |
| `createOwnedApplicationNotification` | POST | same user-owned collection | `notifications.send` |
| `getOwnedApplicationNotification` | GET | user-owned detail | `notifications.read` |
| `deleteOwnedApplicationNotification` | DELETE | user-owned detail | `notifications.delete` |
| `listGroupedNotifications` | GET | `/groups/{group_name}/notifications/` | `notifications.read` |
| `createGroupedNotification` | POST | `/groups/{group_name}/notifications/` | `notifications.send` |

All remaining templates, digests, receipts, attempts, interactions, push-token, preference, usage, realtime and bulk operations remain in the operation catalogue.
