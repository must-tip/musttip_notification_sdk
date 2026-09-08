export declare const OPERATIONS: {
    readonly addNotificationAttachmentReference: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/attachments/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.attachments.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly buildDigest: {
        readonly method: "POST";
        readonly path: "/digests/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.digests.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly cancelNotification: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/cancel/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.cancel"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly commandDigest: {
        readonly method: "POST";
        readonly path: "/digests/{public_id}/command/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.digests.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly consumeRealtimeTicket: {
        readonly method: "POST";
        readonly path: "/realtime/tickets/consume/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.realtime"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly createApplicationNotification: {
        readonly method: "POST";
        readonly path: "/applications/{application_id}/notifications/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.send"];
        readonly successStatuses: readonly [200, 201, 202];
    };
    readonly createBulkMutation: {
        readonly method: "POST";
        readonly path: "/bulk-mutations/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.send"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly createGroupedNotification: {
        readonly method: "POST";
        readonly path: "/groups/{group_name}/notifications/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.send"];
        readonly successStatuses: readonly [200, 201, 202];
    };
    readonly createNotification: {
        readonly method: "POST";
        readonly path: "/notifications/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.send"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly createNotificationBatch: {
        readonly method: "POST";
        readonly path: "/notifications/batch/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.batch.send"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly createOwnedApplicationNotification: {
        readonly method: "POST";
        readonly path: "/applications/{application_id}/users/{recipient_identifier}/notifications/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.send"];
        readonly successStatuses: readonly [200, 201, 202];
    };
    readonly createRecipientPreferenceScope: {
        readonly method: "POST";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly createTemplate: {
        readonly method: "POST";
        readonly path: "/templates/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.templates.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly deactivateTemplate: {
        readonly method: "DELETE";
        readonly path: "/templates/{template_key}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.templates.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly deleteApplicationNotification: {
        readonly method: "DELETE";
        readonly path: "/applications/{application_id}/notifications/{public_id}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.delete"];
        readonly successStatuses: readonly [200, 202, 204];
    };
    readonly deleteNotification: {
        readonly method: "DELETE";
        readonly path: "/notifications/{public_id}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.delete"];
        readonly successStatuses: readonly [200, 202, 204];
    };
    readonly deleteNotificationAttachment: {
        readonly method: "DELETE";
        readonly path: "/notifications/{public_id}/attachments/{attachment_id}/command/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.attachments.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly deleteOwnedApplicationNotification: {
        readonly method: "DELETE";
        readonly path: "/applications/{application_id}/users/{recipient_identifier}/notifications/{public_id}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.delete"];
        readonly successStatuses: readonly [200, 202, 204];
    };
    readonly deleteRecipientPreferenceScope: {
        readonly method: "DELETE";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly getApplicationNotification: {
        readonly method: "GET";
        readonly path: "/applications/{application_id}/notifications/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getBulkMutation: {
        readonly method: "GET";
        readonly path: "/bulk-mutations/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getDigest: {
        readonly method: "GET";
        readonly path: "/digests/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.digests.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getExternalNotificationCapabilities: {
        readonly method: "GET";
        readonly path: "/capabilities/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getNotification: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getNotificationSummary: {
        readonly method: "GET";
        readonly path: "/notifications/summary/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getOwnedApplicationNotification: {
        readonly method: "GET";
        readonly path: "/applications/{application_id}/users/{recipient_identifier}/notifications/{public_id}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getRecipientPreferences: {
        readonly method: "GET";
        readonly path: "/recipients/{recipient_identifier}/preferences/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.preferences.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getTemplate: {
        readonly method: "GET";
        readonly path: "/templates/{template_key}/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.templates.read"];
        readonly successStatuses: readonly [200];
    };
    readonly getUsageSummary: {
        readonly method: "GET";
        readonly path: "/usage/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.usage.read"];
        readonly successStatuses: readonly [200];
    };
    readonly issueRealtimeTicket: {
        readonly method: "POST";
        readonly path: "/realtime/tickets/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.realtime"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly listApplicationNotifications: {
        readonly method: "GET";
        readonly path: "/applications/{application_id}/notifications/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listDigests: {
        readonly method: "GET";
        readonly path: "/digests/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.digests.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listGroupedNotifications: {
        readonly method: "GET";
        readonly path: "/groups/{group_name}/notifications/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listNotificationAttachments: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/attachments/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listNotificationAttempts: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/attempts/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.attempts.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listNotificationInteractions: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/interactions/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listNotificationReceipts: {
        readonly method: "GET";
        readonly path: "/notifications/{public_id}/receipts/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.receipts.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listNotifications: {
        readonly method: "GET";
        readonly path: "/notifications/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listOwnedApplicationNotifications: {
        readonly method: "GET";
        readonly path: "/applications/{application_id}/users/{recipient_identifier}/notifications/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listPushTokens: {
        readonly method: "GET";
        readonly path: "/push-tokens/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
        readonly successStatuses: readonly [200];
    };
    readonly listRecipientPreferenceScopes: {
        readonly method: "GET";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.preferences.read"];
        readonly successStatuses: readonly [200];
    };
    readonly listTemplates: {
        readonly method: "GET";
        readonly path: "/templates/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.templates.read"];
        readonly successStatuses: readonly [200];
    };
    readonly previewTemplate: {
        readonly method: "POST";
        readonly path: "/templates/preview/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.templates.read"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly recordNotificationInteraction: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/interactions/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.events.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly registerPushToken: {
        readonly method: "POST";
        readonly path: "/push-tokens/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly retryNotification: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/retry/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.retry"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly revokePushToken: {
        readonly method: "POST";
        readonly path: "/push-tokens/revoke/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly rotatePushToken: {
        readonly method: "POST";
        readonly path: "/push-tokens/rotate/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.tokens.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly scanNotificationAttachment: {
        readonly method: "POST";
        readonly path: "/notifications/{public_id}/attachments/{attachment_id}/command/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.attachments.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly syncNotifications: {
        readonly method: "GET";
        readonly path: "/notifications/sync/";
        readonly idempotencyRequired: false;
        readonly requiredScopes: readonly ["notifications.read"];
        readonly successStatuses: readonly [200];
    };
    readonly updateRecipientPreferenceScope: {
        readonly method: "PATCH";
        readonly path: "/recipients/{recipient_identifier}/preference-scopes/{scope_application_id}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly updateRecipientPreferences: {
        readonly method: "PATCH";
        readonly path: "/recipients/{recipient_identifier}/preferences/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.preferences.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
    readonly updateTemplate: {
        readonly method: "PATCH";
        readonly path: "/templates/{template_key}/";
        readonly idempotencyRequired: true;
        readonly requiredScopes: readonly ["notifications.templates.write"];
        readonly successStatuses: readonly [200, 201, 202, 204];
    };
};
export type OperationId = keyof typeof OPERATIONS;
