export declare const OPERATIONS: {
    readonly addNotificationAttachmentReference: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/attachments/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.attachments.write"];
    };
    readonly buildDigest: {
        readonly method: "POST";
        readonly path: "/digests/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.digests.write"];
    };
    readonly cancelNotification: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/cancel/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.cancel"];
    };
    readonly commandDigest: {
        readonly method: "POST";
        readonly path: "/digests/{public_id}/command/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.digests.write"];
    };
    readonly consumeRealtimeTicket: {
        readonly method: "POST";
        readonly path: "/realtime/tickets/consume/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.realtime"];
    };
    readonly createBulkMutation: {
        readonly method: "POST";
        readonly path: "/bulk-mutations/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.send"];
    };
    readonly createNotification: {
        readonly method: "POST";
        readonly path: "/notifications/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.send"];
    };
    readonly createNotificationBatch: {
        readonly method: "POST";
        readonly path: "/notifications/batch/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.batch.send"];
    };
    readonly createRecipientPreferenceScope: {
        readonly method: "POST";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
    };
    readonly createTemplate: {
        readonly method: "POST";
        readonly path: "/templates/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.templates.write"];
    };
    readonly deactivateTemplate: {
        readonly method: "DELETE";
        readonly path: "/templates/{template_key}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.templates.write"];
    };
    readonly deleteNotificationAttachment: {
        readonly method: "DELETE";
        readonly path: "/notifications/{public_id}/attachments/{attachment_id}/command/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.attachments.write"];
    };
    readonly deleteRecipientPreferenceScope: {
        readonly method: "DELETE";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
    };
    readonly getBulkMutation: {
        readonly method: "GET";
        readonly path: "/bulk-mutations/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly getDigest: {
        readonly method: "GET";
        readonly path: "/digests/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.digests.read"];
    };
    readonly getExternalNotificationCapabilities: {
        readonly method: "GET";
        readonly path: "/capabilities/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly getNotification: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly getNotificationSummary: {
        readonly method: "GET";
        readonly path: "/notifications/summary/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly getRecipientPreferences: {
        readonly method: "GET";
        readonly path: "/recipients/{recipient_identifier}/preferences/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.preferences.read"];
    };
    readonly getTemplate: {
        readonly method: "GET";
        readonly path: "/templates/{template_key}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.templates.read"];
    };
    readonly getUsageSummary: {
        readonly method: "GET";
        readonly path: "/usage/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.usage.read"];
    };
    readonly issueRealtimeTicket: {
        readonly method: "POST";
        readonly path: "/realtime/tickets/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.realtime"];
    };
    readonly listDigests: {
        readonly method: "GET";
        readonly path: "/digests/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.digests.read"];
    };
    readonly listNotificationAttachments: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/attachments/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly listNotificationAttempts: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/attempts/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.attempts.read"];
    };
    readonly listNotificationInteractions: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/interactions/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly listNotificationReceipts: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/receipts/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.receipts.read"];
    };
    readonly listNotifications: {
        readonly method: "GET";
        readonly path: "/notifications/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly listPushTokens: {
        readonly method: "GET";
        readonly path: "/push-tokens/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
    };
    readonly listRecipientPreferenceScopes: {
        readonly method: "GET";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.preferences.read"];
    };
    readonly listTemplates: {
        readonly method: "GET";
        readonly path: "/templates/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.templates.read"];
    };
    readonly previewTemplate: {
        readonly method: "POST";
        readonly path: "/templates/preview/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.templates.read"];
    };
    readonly recordNotificationInteraction: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/interactions/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.events.write"];
    };
    readonly registerPushToken: {
        readonly method: "POST";
        readonly path: "/push-tokens/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
    };
    readonly retryNotification: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/retry/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.retry"];
    };
    readonly revokePushToken: {
        readonly method: "POST";
        readonly path: "/push-tokens/revoke/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
    };
    readonly rotatePushToken: {
        readonly method: "POST";
        readonly path: "/push-tokens/rotate/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
    };
    readonly scanNotificationAttachment: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/attachments/{attachment_id}/command/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.attachments.write"];
    };
    readonly syncNotifications: {
        readonly method: "GET";
        readonly path: "/notifications/sync/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
    };
    readonly updateRecipientPreferenceScope: {
        readonly method: "PATCH";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
    };
    readonly updateRecipientPreferences: {
        readonly method: "PATCH";
        readonly path: "/recipients/{recipient_identifier}/preferences/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
    };
    readonly updateTemplate: {
        readonly method: "PATCH";
        readonly path: "/templates/{template_key}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.templates.write"];
    };
};
export type OperationId = keyof typeof OPERATIONS;
