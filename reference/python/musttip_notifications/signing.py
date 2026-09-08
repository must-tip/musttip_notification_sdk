from __future__ import annotations

import base64
import hashlib
import hmac
from typing import Mapping

from .errors import ConfigurationError, ProtocolError


def sign_event_payload(payload: bytes, *, secret: str, key_id: str) -> dict[str, str]:
    if not isinstance(payload, bytes):
        raise TypeError("payload must be bytes")
    if len(secret) < 32:
        raise ConfigurationError("event signing secret must contain at least 32 characters")
    if not key_id or len(key_id) > 64 or any(ch.isspace() for ch in key_id):
        raise ConfigurationError("event signing key ID is invalid")
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).digest()
    signature = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return {"signature": signature, "signature-key-id": key_id}


def verify_event_payload(
    payload: bytes,
    headers: Mapping[str, str],
    *,
    secrets: Mapping[str, str],
    required: bool = True,
) -> bool:
    signature = headers.get("signature")
    key_id = headers.get("signature-key-id")
    if signature is None and key_id is None:
        if required:
            raise ProtocolError("event signature is required")
        return False
    if not signature or not key_id:
        raise ProtocolError("event signature headers are incomplete")
    secret = secrets.get(key_id)
    if secret is None:
        raise ProtocolError("event signing key is unknown")
    expected = sign_event_payload(payload, secret=secret, key_id=key_id)["signature"]
    if not hmac.compare_digest(expected, signature):
        raise ProtocolError("event signature is invalid")
    return True
