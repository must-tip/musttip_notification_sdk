from __future__ import annotations

import email.utils
import json
import random
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from typing import Mapping, MutableMapping, Sequence

from .catalog import get_operation
from .config import SdkConfig
from .errors import (
    ApiError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    NotFoundError,
    PreconditionError,
    ProtocolError,
    RateLimitError,
    ServiceUnavailableError,
    TransportError,
)
from .jsonutil import dumps_bounded, loads_strict
from .models import ApiResponse

_RETRYABLE_STATUS = frozenset({408, 425, 429, 500, 502, 503, 504})
_PATH_PARAMETER_RE = re.compile(r"\{([A-Za-z_][A-Za-z0-9_]*)\}")


class NotificationsClient:
    """Dependency-free reference client. Generated clients remain the primary multi-language surface."""

    def __init__(self, config: SdkConfig) -> None:
        self.config = config
        self._ssl_context = None if config.verify_tls else ssl._create_unverified_context()  # noqa: SLF001

    def call_operation(
        self,
        operation_id: str,
        *,
        path: Mapping[str, object] | None = None,
        query: Mapping[str, object] | None = None,
        body: object | None = None,
        idempotency_key: str | None = None,
        expected_version: int | None = None,
        headers: Mapping[str, str] | None = None,
    ) -> ApiResponse[object]:
        operation = get_operation(operation_id)
        if operation.idempotency_required and not idempotency_key:
            raise ProtocolError(f"{operation_id} requires an idempotency key")
        url = self._build_url(operation.path, path or {}, query or {})
        request_headers: MutableMapping[str, str] = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.config.resolve_token()}",
            "User-Agent": self._user_agent(),
            "X-MustTip-SDK-Version": "1.0.0",
            **{str(k): str(v) for k, v in self.config.default_headers.items()},
        }
        if idempotency_key:
            self._validate_header_value(idempotency_key, "Idempotency-Key", maximum=128)
            request_headers["Idempotency-Key"] = idempotency_key
        if expected_version is not None:
            if expected_version < 0:
                raise ProtocolError("expected_version cannot be negative")
            request_headers["If-Match"] = f'"{expected_version}"'
        for name, value in (headers or {}).items():
            self._validate_header_value(str(value), str(name), maximum=4096)
            request_headers[str(name)] = str(value)
        encoded_body = None
        if body is not None:
            encoded_body = dumps_bounded(body, maximum_bytes=self.config.maximum_request_bytes)
            request_headers["Content-Type"] = "application/json"
        retryable = operation.method in {"GET", "HEAD", "OPTIONS"} or bool(idempotency_key)
        last_error: BaseException | None = None
        for attempt in range(self.config.maximum_attempts):
            try:
                request = urllib.request.Request(url, data=encoded_body, headers=dict(request_headers), method=operation.method)
                with urllib.request.urlopen(request, timeout=self.config.timeout_seconds, context=self._ssl_context) as response:
                    raw = response.read(self.config.maximum_response_bytes + 1)
                    if len(raw) > self.config.maximum_response_bytes:
                        raise ProtocolError("response body exceeds the configured maximum")
                    data = loads_strict(raw, maximum_bytes=self.config.maximum_response_bytes)
                    response_headers = {str(k).casefold(): str(v) for k, v in response.headers.items()}
                    request_id = response_headers.get("x-request-id", "")
                    return ApiResponse(int(response.status), data, response_headers, request_id)
            except urllib.error.HTTPError as exc:
                raw = exc.read(self.config.maximum_response_bytes + 1)
                headers_map = {str(k).casefold(): str(v) for k, v in exc.headers.items()}
                if retryable and exc.code in _RETRYABLE_STATUS and attempt + 1 < self.config.maximum_attempts:
                    self._sleep(attempt, headers_map.get("retry-after"))
                    continue
                raise self._api_error(exc.code, raw, headers_map) from exc
            except (urllib.error.URLError, TimeoutError, OSError) as exc:
                last_error = exc
                if retryable and attempt + 1 < self.config.maximum_attempts:
                    self._sleep(attempt, None)
                    continue
                raise TransportError("notification API transport failed") from exc
        raise TransportError("notification API request exhausted retries") from last_error

    def create_notification(self, notification: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "createNotification",
            body=dict(notification),
            idempotency_key=idempotency_key or f"notification-{uuid.uuid4()}",
        )

    def create_notification_batch(self, notifications: Sequence[Mapping[str, object]], *, atomic: bool = True, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "createNotificationBatch",
            body={"notifications": [dict(item) for item in notifications], "atomic": atomic},
            idempotency_key=idempotency_key or f"notification-batch-{uuid.uuid4()}",
        )

    def list_notifications(self, **query: object) -> ApiResponse[object]:
        return self.call_operation("listNotifications", query=query)

    def get_notification(self, public_id: str) -> ApiResponse[object]:
        return self.call_operation("getNotification", path={"public_id": public_id})

    def cancel_notification(self, public_id: str, *, reason: str = "", expected_version: int | None = None, idempotency_key: str | None = None) -> ApiResponse[object]:
        body: dict[str, object] = {"reason": reason}
        if expected_version is not None:
            body["expected_version"] = expected_version
        return self.call_operation(
            "cancelNotification",
            path={"public_id": public_id},
            body=body,
            expected_version=expected_version,
            idempotency_key=idempotency_key or f"cancel-{public_id}-{uuid.uuid4()}",
        )

    def record_interaction(self, public_id: str, interaction: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "recordNotificationInteraction",
            path={"public_id": public_id},
            body=dict(interaction),
            idempotency_key=idempotency_key or f"interaction-{uuid.uuid4()}",
        )

    def issue_realtime_ticket(self, payload: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "issueRealtimeTicket",
            body=dict(payload),
            idempotency_key=idempotency_key or f"realtime-ticket-{uuid.uuid4()}",
        )

    def _build_url(self, path_template: str, path_values: Mapping[str, object], query: Mapping[str, object]) -> str:
        required = set(_PATH_PARAMETER_RE.findall(path_template))
        missing = required - set(path_values)
        unknown = set(path_values) - required
        if missing or unknown:
            raise ProtocolError(f"path parameters mismatch; missing={sorted(missing)} unknown={sorted(unknown)}")
        path = path_template
        for name in required:
            value = str(path_values[name]).strip()
            if not value or len(value) > 1024 or any(ch in value for ch in "\r\n\x00"):
                raise ProtocolError(f"invalid path parameter: {name}")
            path = path.replace("{" + name + "}", urllib.parse.quote(value, safe=""))
        pairs: list[tuple[str, str]] = []
        for key, value in query.items():
            if value is None:
                continue
            values = value if isinstance(value, (list, tuple, set, frozenset)) else [value]
            for item in values:
                if isinstance(item, bool):
                    rendered = "true" if item else "false"
                else:
                    rendered = str(item)
                pairs.append((str(key), rendered))
        suffix = "?" + urllib.parse.urlencode(pairs, doseq=True) if pairs else ""
        return f"{self.config.normalized_base_url}{path}{suffix}"

    def _api_error(self, status: int, raw: bytes, headers: Mapping[str, str]) -> ApiError:
        try:
            decoded = loads_strict(raw, maximum_bytes=self.config.maximum_response_bytes)
        except ProtocolError:
            decoded = None
        message = "Notification API request failed"
        code = ""
        details = decoded
        if isinstance(decoded, dict):
            detail = decoded.get("detail") or decoded.get("message") or decoded.get("error")
            if isinstance(detail, dict):
                message = str(detail.get("message") or message)
                code = str(detail.get("code") or "")
            elif detail is not None:
                message = str(detail)
        kwargs = dict(
            status_code=status,
            message=message[:500],
            request_id=headers.get("x-request-id", ""),
            error_code=code[:128],
            retryable=status in _RETRYABLE_STATUS,
            details=details,
            headers=headers,
        )
        cls = {
            401: AuthenticationError,
            403: AuthorizationError,
            404: NotFoundError,
            409: ConflictError,
            412: PreconditionError,
            428: PreconditionError,
            429: RateLimitError,
            503: ServiceUnavailableError,
        }.get(status, ApiError)
        return cls(**kwargs)

    def _sleep(self, attempt: int, retry_after: str | None) -> None:
        delay = self._parse_retry_after(retry_after)
        if delay is None:
            cap = min(self.config.maximum_retry_delay_seconds, self.config.base_retry_delay_seconds * (2**attempt))
            delay = random.uniform(0.0, cap)
        time.sleep(max(0.0, min(self.config.maximum_retry_delay_seconds, delay)))

    @staticmethod
    def _parse_retry_after(value: str | None) -> float | None:
        if not value:
            return None
        stripped = value.strip()
        if stripped.isdigit():
            return float(stripped)
        try:
            when = email.utils.parsedate_to_datetime(stripped)
            if when.tzinfo is None:
                when = when.replace(tzinfo=timezone.utc)
            return max(0.0, (when - datetime.now(timezone.utc)).total_seconds())
        except (TypeError, ValueError, OverflowError):
            return None

    @staticmethod
    def _validate_header_value(value: str, name: str, *, maximum: int) -> None:
        if not value or len(value) > maximum or "\r" in value or "\n" in value or "\x00" in value:
            raise ProtocolError(f"{name} header value is invalid")

    def _user_agent(self) -> str:
        suffix = self.config.user_agent_suffix.strip()
        return "musttip-notifications-python/1.0.0" + (f" {suffix}" if suffix else "")
