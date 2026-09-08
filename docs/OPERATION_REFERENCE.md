# REST operation reference

Base path: `/api/v1/external/notifications/`

| Operation ID | Method | Path | Required scope | Idempotency |
|---|---:|---|---|---:|
| `createBulkMutation` | POST | `/bulk-mutations/` | `notifications.send` | Required |
| `getBulkMutation` | GET | `/bulk-mutations/{public_id}/` | `notifications.read` | No |
| `getExternalNotificationCapabilities` | GET | `/capabilities/` | `notifications.read` | No |
| `listDigests` | GET | `/digests/` | `notifications.digests.read` | No |
| `buildDigest` | POST | `/digests/` | `notifications.digests.write` | Required |
| `getDigest` | GET | `/digests/{public_id}/` | `notifications.digests.read` | No |
| `commandDigest` | POST | `/digests/{public_id}/command/` | `notifications.digests.write` | Required |
| `listNotifications` | GET | `/notifications/` | `notifications.read` | No |
| `createNotification` | POST | `/notifications/` | `notifications.send` | Required |
| `createNotificationBatch` | POST | `/notifications/batch/` | `notifications.batch.send` | Required |
| `getNotificationSummary` | GET | `/notifications/summary/` | `notifications.read` | No |
| `syncNotifications` | GET | `/notifications/sync/` | `notifications.read` | No |
| `getNotification` | GET | `/notifications/{public_id}/` | `notifications.read` | No |
| `listNotificationAttachments` | GET | `/notifications/{public_id}/attachments/` | `notifications.read` | No |
| `addNotificationAttachmentReference` | POST | `/notifications/{public_id}/attachments/` | `notifications.attachments.write` | Required |
| `deleteNotificationAttachment` | DELETE | `/notifications/{public_id}/attachments/{attachment_id}/command/` | `notifications.attachments.write` | Required |
| `scanNotificationAttachment` | POST | `/notifications/{public_id}/attachments/{attachment_id}/command/` | `notifications.attachments.write` | Required |
| `listNotificationAttempts` | GET | `/notifications/{public_id}/attempts/` | `notifications.attempts.read` | No |
| `cancelNotification` | POST | `/notifications/{public_id}/cancel/` | `notifications.cancel` | Required |
| `listNotificationInteractions` | GET | `/notifications/{public_id}/interactions/` | `notifications.read` | No |
| `recordNotificationInteraction` | POST | `/notifications/{public_id}/interactions/` | `notifications.events.write` | Required |
| `listNotificationReceipts` | GET | `/notifications/{public_id}/receipts/` | `notifications.receipts.read` | No |
| `retryNotification` | POST | `/notifications/{public_id}/retry/` | `notifications.retry` | Required |
| `listPushTokens` | GET | `/push-tokens/` | `notifications.tokens.write` | No |
| `registerPushToken` | POST | `/push-tokens/` | `notifications.tokens.write` | Required |
| `revokePushToken` | POST | `/push-tokens/revoke/` | `notifications.tokens.write` | Required |
| `rotatePushToken` | POST | `/push-tokens/rotate/` | `notifications.tokens.write` | Required |
| `issueRealtimeTicket` | POST | `/realtime/tickets/` | `notifications.realtime` | Required |
| `consumeRealtimeTicket` | POST | `/realtime/tickets/consume/` | `notifications.realtime` | Required |
| `listRecipientPreferenceScopes` | GET | `/recipients/{recipient_identifier}/preference-scopes/` | `notifications.preferences.read` | No |
| `createRecipientPreferenceScope` | POST | `/recipients/{recipient_identifier}/preference-scopes/` | `notifications.preferences.write` | Required |
| `deleteRecipientPreferenceScope` | DELETE | `/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/` | `notifications.preferences.write` | Required |
| `updateRecipientPreferenceScope` | PATCH | `/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/` | `notifications.preferences.write` | Required |
| `getRecipientPreferences` | GET | `/recipients/{recipient_identifier}/preferences/` | `notifications.preferences.read` | No |
| `updateRecipientPreferences` | PATCH | `/recipients/{recipient_identifier}/preferences/` | `notifications.preferences.write` | Required |
| `listTemplates` | GET | `/templates/` | `notifications.templates.read` | No |
| `createTemplate` | POST | `/templates/` | `notifications.templates.write` | Required |
| `previewTemplate` | POST | `/templates/preview/` | `notifications.templates.read` | No |
| `deactivateTemplate` | DELETE | `/templates/{template_key}/` | `notifications.templates.write` | Required |
| `getTemplate` | GET | `/templates/{template_key}/` | `notifications.templates.read` | No |
| `updateTemplate` | PATCH | `/templates/{template_key}/` | `notifications.templates.write` | Required |
| `getUsageSummary` | GET | `/usage/` | `notifications.usage.read` | No |

Generated clients preserve these `operationId` values. Reference clients may invoke any operation through the generic operation method even when no convenience wrapper is present.
