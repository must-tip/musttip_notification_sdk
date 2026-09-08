from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Mapping

from .errors import ConfigurationError, ProtocolError
from .jsonutil import dumps_bounded, loads_strict

PROTOCOL_VERSION = 1
_SAFE_EVENT = re.compile(r"^[A-Za-z][A-Za-z0-9._:-]{0,127}$", re.ASCII)
_SAFE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$", re.ASCII)


@dataclass(frozen=True, slots=True)
class RealtimeRoute:
    path: str
    subprotocol: str


INTERNAL_RECIPIENT = RealtimeRoute("/ws/v1/notifications/", "musttip.notifications.v1")
EXTERNAL_DEVELOPER = RealtimeRoute("/ws/v1/external/notifications/", "musttip.external-notifications.v1")
EXTERNAL_RECIPIENT = RealtimeRoute("/ws/v1/external/notifications/recipient/", "musttip.external-notification-recipient.v1")
TICKET_PREFIX = "musttip.notification-ticket."


def recipient_ticket_subprotocols(ticket: str) -> tuple[str, str]:
    value = str(ticket or "").strip()
    if len(value) < 20 or len(value) > 1024 or any(ch.isspace() for ch in value):
        raise ConfigurationError("realtime ticket is invalid")
    return EXTERNAL_RECIPIENT.subprotocol, f"{TICKET_PREFIX}{value}"


def build_request(
    event_type: str,
    payload: Mapping[str, object] | None = None,
    *,
    request_id: str | None = None,
    idempotency_key: str | None = None,
    trace_id: str | None = None,
    correlation_id: str | None = None,
    maximum_bytes: int = 65_536,
) -> str:
    if not _SAFE_EVENT.fullmatch(event_type):
        raise ConfigurationError("realtime event_type is invalid")
    resolved_request_id = request_id or uuid.uuid4().hex
    if not _SAFE_ID.fullmatch(resolved_request_id):
        raise ConfigurationError("realtime request_id is invalid")
    envelope: dict[str, object] = {
        "protocol_version": PROTOCOL_VERSION,
        "event_type": event_type,
        "request_id": resolved_request_id,
        "payload": dict(payload or {}),
    }
    for key, value in {
        "idempotency_key": idempotency_key,
        "trace_id": trace_id,
        "correlation_id": correlation_id,
    }.items():
        if value:
            envelope[key] = value
    return dumps_bounded(envelope, maximum_bytes=maximum_bytes).decode("utf-8")


def parse_message(text: str, *, maximum_bytes: int = 1_048_576) -> Mapping[str, object]:
    decoded = loads_strict(text.encode("utf-8"), maximum_bytes=maximum_bytes)
    if not isinstance(decoded, dict):
        raise ProtocolError("realtime message must be a JSON object")
    if decoded.get("protocol_version") != PROTOCOL_VERSION:
        raise ProtocolError("unsupported realtime protocol version")
    message_type = decoded.get("type")
    if message_type not in {"notification.response", "notification.event", "notification.error"}:
        raise ProtocolError("unknown realtime message type")
    return decoded


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
