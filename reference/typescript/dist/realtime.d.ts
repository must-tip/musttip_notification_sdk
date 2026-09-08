export declare const PROTOCOL_VERSION: 1;
export declare const INTERNAL_RECIPIENT: {
    readonly path: "/ws/v1/notifications/";
    readonly subprotocol: "musttip.notifications.v1";
};
export declare const EXTERNAL_DEVELOPER: {
    readonly path: "/ws/v1/external/notifications/";
    readonly subprotocol: "musttip.external-notifications.v1";
};
export declare const EXTERNAL_RECIPIENT: {
    readonly path: "/ws/v1/external/notifications/recipient/";
    readonly subprotocol: "musttip.external-notification-recipient.v1";
};
export declare const TICKET_PREFIX = "musttip.notification-ticket.";
export interface RealtimeRequest {
    protocol_version: 1;
    event_type: string;
    request_id: string;
    payload: Record<string, unknown>;
    idempotency_key?: string;
    trace_id?: string;
    correlation_id?: string;
}
export declare function recipientTicketSubprotocols(ticket: string): readonly [string, string];
export declare function buildRealtimeRequest(eventType: string, payload?: Record<string, unknown>, options?: {
    requestId?: string;
    idempotencyKey?: string;
    traceId?: string;
    correlationId?: string;
}): RealtimeRequest;
export declare function parseRealtimeMessage(text: string): Record<string, unknown>;
