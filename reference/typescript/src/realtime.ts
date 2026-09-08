import { ConfigurationError, ProtocolError } from "./errors.js";
import { parseStrictJson } from "./json.js";

export const PROTOCOL_VERSION = 1 as const;
export const INTERNAL_RECIPIENT = { path: "/ws/v1/notifications/", subprotocol: "musttip.notifications.v1" } as const;
export const EXTERNAL_DEVELOPER = { path: "/ws/v1/external/notifications/", subprotocol: "musttip.external-notifications.v1" } as const;
export const EXTERNAL_RECIPIENT = { path: "/ws/v1/external/notifications/recipient/", subprotocol: "musttip.external-notification-recipient.v1" } as const;
export const TICKET_PREFIX = "musttip.notification-ticket.";

const SAFE_EVENT = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export interface RealtimeRequest {
  protocol_version: 1;
  event_type: string;
  request_id: string;
  payload: Record<string, unknown>;
  idempotency_key?: string;
  trace_id?: string;
  correlation_id?: string;
}

export function recipientTicketSubprotocols(ticket: string): readonly [string, string] {
  const value = ticket.trim();
  if (value.length < 20 || value.length > 1024 || /\s/.test(value)) {
    throw new ConfigurationError("realtime ticket is invalid");
  }
  return [EXTERNAL_RECIPIENT.subprotocol, `${TICKET_PREFIX}${value}`] as const;
}

export function buildRealtimeRequest(
  eventType: string,
  payload: Record<string, unknown> = {},
  options: { requestId?: string; idempotencyKey?: string; traceId?: string; correlationId?: string } = {},
): RealtimeRequest {
  if (!SAFE_EVENT.test(eventType)) throw new ConfigurationError("realtime event type is invalid");
  const requestId = options.requestId ?? crypto.randomUUID();
  if (!SAFE_ID.test(requestId)) throw new ConfigurationError("realtime request ID is invalid");
  return {
    protocol_version: PROTOCOL_VERSION,
    event_type: eventType,
    request_id: requestId,
    payload,
    ...(options.idempotencyKey ? { idempotency_key: options.idempotencyKey } : {}),
    ...(options.traceId ? { trace_id: options.traceId } : {}),
    ...(options.correlationId ? { correlation_id: options.correlationId } : {}),
  };
}

export function parseRealtimeMessage(text: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = parseStrictJson(text);
  } catch (error) {
    throw new ProtocolError("realtime message is not valid JSON", { cause: error });
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ProtocolError("realtime message must be an object");
  const record = value as Record<string, unknown>;
  if (record.protocol_version !== PROTOCOL_VERSION) throw new ProtocolError("unsupported realtime protocol version");
  if (!["notification.response", "notification.event", "notification.error"].includes(String(record.type))) {
    throw new ProtocolError("unknown realtime message type");
  }
  return record;
}
