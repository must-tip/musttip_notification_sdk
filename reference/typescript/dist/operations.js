export const OPERATIONS = {
    "addNotificationAttachmentReference": {
        "method": "POST",
        "path": "/notifications/{public_id}/attachments/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.attachments.write"
        ]
    },
    "buildDigest": {
        "method": "POST",
        "path": "/digests/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.digests.write"
        ]
    },
    "cancelNotification": {
        "method": "POST",
        "path": "/notifications/{public_id}/cancel/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.cancel"
        ]
    },
    "commandDigest": {
        "method": "POST",
        "path": "/digests/{public_id}/command/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.digests.write"
        ]
    },
    "consumeRealtimeTicket": {
        "method": "POST",
        "path": "/realtime/tickets/consume/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.realtime"
        ]
    },
    "createBulkMutation": {
        "method": "POST",
        "path": "/bulk-mutations/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.send"
        ]
    },
    "createNotification": {
        "method": "POST",
        "path": "/notifications/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.send"
        ]
    },
    "createNotificationBatch": {
        "method": "POST",
        "path": "/notifications/batch/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.batch.send"
        ]
    },
    "createRecipientPreferenceScope": {
        "method": "POST",
        "path": "/recipients/{recipient_identifier}/preference-scopes/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.preferences.write"
        ]
    },
    "createTemplate": {
        "method": "POST",
        "path": "/templates/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.templates.write"
        ]
    },
    "deactivateTemplate": {
        "method": "DELETE",
        "path": "/templates/{template_key}/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.templates.write"
        ]
    },
    "deleteNotificationAttachment": {
        "method": "DELETE",
        "path": "/notifications/{public_id}/attachments/{attachment_id}/command/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.attachments.write"
        ]
    },
    "deleteRecipientPreferenceScope": {
        "method": "DELETE",
        "path": "/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.preferences.write"
        ]
    },
    "getBulkMutation": {
        "method": "GET",
        "path": "/bulk-mutations/{public_id}/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "getDigest": {
        "method": "GET",
        "path": "/digests/{public_id}/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.digests.read"
        ]
    },
    "getExternalNotificationCapabilities": {
        "method": "GET",
        "path": "/capabilities/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "getNotification": {
        "method": "GET",
        "path": "/notifications/{public_id}/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "getNotificationSummary": {
        "method": "GET",
        "path": "/notifications/summary/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "getRecipientPreferences": {
        "method": "GET",
        "path": "/recipients/{recipient_identifier}/preferences/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.preferences.read"
        ]
    },
    "getTemplate": {
        "method": "GET",
        "path": "/templates/{template_key}/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.templates.read"
        ]
    },
    "getUsageSummary": {
        "method": "GET",
        "path": "/usage/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.usage.read"
        ]
    },
    "issueRealtimeTicket": {
        "method": "POST",
        "path": "/realtime/tickets/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.realtime"
        ]
    },
    "listDigests": {
        "method": "GET",
        "path": "/digests/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.digests.read"
        ]
    },
    "listNotificationAttachments": {
        "method": "GET",
        "path": "/notifications/{public_id}/attachments/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "listNotificationAttempts": {
        "method": "GET",
        "path": "/notifications/{public_id}/attempts/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.attempts.read"
        ]
    },
    "listNotificationInteractions": {
        "method": "GET",
        "path": "/notifications/{public_id}/interactions/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "listNotificationReceipts": {
        "method": "GET",
        "path": "/notifications/{public_id}/receipts/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.receipts.read"
        ]
    },
    "listNotifications": {
        "method": "GET",
        "path": "/notifications/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "listPushTokens": {
        "method": "GET",
        "path": "/push-tokens/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.tokens.write"
        ]
    },
    "listRecipientPreferenceScopes": {
        "method": "GET",
        "path": "/recipients/{recipient_identifier}/preference-scopes/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.preferences.read"
        ]
    },
    "listTemplates": {
        "method": "GET",
        "path": "/templates/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.templates.read"
        ]
    },
    "previewTemplate": {
        "method": "POST",
        "path": "/templates/preview/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.templates.read"
        ]
    },
    "recordNotificationInteraction": {
        "method": "POST",
        "path": "/notifications/{public_id}/interactions/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.events.write"
        ]
    },
    "registerPushToken": {
        "method": "POST",
        "path": "/push-tokens/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.tokens.write"
        ]
    },
    "retryNotification": {
        "method": "POST",
        "path": "/notifications/{public_id}/retry/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.retry"
        ]
    },
    "revokePushToken": {
        "method": "POST",
        "path": "/push-tokens/revoke/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.tokens.write"
        ]
    },
    "rotatePushToken": {
        "method": "POST",
        "path": "/push-tokens/rotate/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.tokens.write"
        ]
    },
    "scanNotificationAttachment": {
        "method": "POST",
        "path": "/notifications/{public_id}/attachments/{attachment_id}/command/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.attachments.write"
        ]
    },
    "syncNotifications": {
        "method": "GET",
        "path": "/notifications/sync/",
        "idempotencyRequired": false,
        "requiredScopes": [
            "notifications.read"
        ]
    },
    "updateRecipientPreferenceScope": {
        "method": "PATCH",
        "path": "/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.preferences.write"
        ]
    },
    "updateRecipientPreferences": {
        "method": "PATCH",
        "path": "/recipients/{recipient_identifier}/preferences/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.preferences.write"
        ]
    },
    "updateTemplate": {
        "method": "PATCH",
        "path": "/templates/{template_key}/",
        "idempotencyRequired": true,
        "requiredScopes": [
            "notifications.templates.write"
        ]
    }
};
