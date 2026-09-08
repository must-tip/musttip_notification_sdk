from __future__ import annotations

import email.utils
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
from .config import SdkConfig, validate_extension_headers
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

SDK_VERSION = "1.1.0"
_RETRYABLE_STATUS = frozenset({408, 425, 429, 500, 502, 503, 504})
_PATH_PARAMETER_RE = re.compile(r"\{([A-Za-z_][A-Za-z0-9_]*)\}")
_FORBIDDEN_AUTHORITY_INPUTS = frozenset({"tenant_id", "tenant", "x_tenant_id"})
_FORBIDDEN_QUERY_INPUTS = _FORBIDDEN_AUTHORITY_INPUTS | frozenset({"application_id"})
_GROUP_RE = re.compile(r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$", re.ASCII)


class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        return None


class NotificationsClient:
    """Dependency-free reference client for the external developer notification API.

    Tenant authority is never accepted as SDK input. The notification service derives
    tenant ownership exclusively from the verified OAuth access token.
    """

    def __init__(self, config: SdkConfig) -> None:
        self.config = config
        context = ssl.create_default_context()
        if not config.verify_tls:
            # SdkConfig restricts this explicit development opt-out to loopback hosts.
            context = ssl._create_unverified_context()  # nosec B323
        handlers: list[urllib.request.BaseHandler] = [_NoRedirectHandler()]
        if config.normalized_base_url.startswith("https://"):
            handlers.append(urllib.request.HTTPSHandler(context=context))
        self._opener = urllib.request.build_opener(*handlers)

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
        path_values = path or {}
        query_values = query or {}
        self._reject_authority_overrides(path_values, query_values, body)
        url = self._build_url(operation.path, path_values, query_values)

        custom_headers = headers or {}
        validate_extension_headers(custom_headers, source="headers")
        request_headers: MutableMapping[str, str] = {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.config.resolve_token()}",
            "User-Agent": self._user_agent(),
            "X-MustTip-SDK-Version": SDK_VERSION,
        }
        request_headers.update({str(k): str(v) for k, v in self.config.default_headers.items()})
        request_headers.update({str(k): str(v) for k, v in custom_headers.items()})
        if idempotency_key:
            self._validate_header_value(idempotency_key, "Idempotency-Key", maximum=128)
            request_headers["Idempotency-Key"] = idempotency_key
        if expected_version is not None:
            if type(expected_version) is not int or expected_version < 0:
                raise ProtocolError("expected_version must be a non-negative integer")
            request_headers["If-Match"] = f'"{expected_version}"'

        encoded_body = None
        if body is not None:
            encoded_body = dumps_bounded(body, maximum_bytes=self.config.maximum_request_bytes)
            request_headers["Content-Type"] = "application/json"

        retryable = operation.method in {"GET", "HEAD", "OPTIONS"} or bool(idempotency_key)
        last_error: BaseException | None = None
        for attempt in range(self.config.maximum_attempts):
            try:
                request = urllib.request.Request(url, data=encoded_body, headers=dict(request_headers), method=operation.method)
                with self._opener.open(request, timeout=self.config.timeout_seconds) as response:
                    raw = response.read(self.config.maximum_response_bytes + 1)
                    if len(raw) > self.config.maximum_response_bytes:
                        raise ProtocolError("response body exceeds the configured maximum")
                    status = int(response.status)
                    if operation.success_statuses and status not in operation.success_statuses:
                        raise ProtocolError(f"{operation_id} returned undocumented success status {status}")
                    data = None if not raw else loads_strict(raw, maximum_bytes=self.config.maximum_response_bytes)
                    response_headers = {str(k).casefold(): str(v) for k, v in response.headers.items()}
                    request_id = response_headers.get("x-request-id", "")
                    return ApiResponse(status, data, response_headers, request_id)
            except urllib.error.HTTPError as exc:
                with exc:
                    raw = exc.read(self.config.maximum_response_bytes + 1)
                if len(raw) > self.config.maximum_response_bytes:
                    raise ProtocolError("error response body exceeds the configured maximum") from exc
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

    # Canonical tenant/application-scoped operations. Tenant identity is never a parameter.
    def capabilities(self) -> ApiResponse[object]:
        return self.call_operation("getExternalNotificationCapabilities")

    def for_application(self, application_id: str) -> "ApplicationNotificationsClient":
        return ApplicationNotificationsClient(self, self._identifier(application_id, "application_id"))

    def for_user(self, application_id: str, recipient_identifier: str) -> "UserNotificationsClient":
        return UserNotificationsClient(
            self,
            self._identifier(application_id, "application_id"),
            self._identifier(recipient_identifier, "recipient_identifier"),
        )

    def create_notification(self, notification: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation("createNotification", body=dict(notification), idempotency_key=idempotency_key or self._key("notification"))

    def create_notification_batch(self, notifications: Sequence[Mapping[str, object]], *, atomic: bool = True, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "createNotificationBatch",
            body={"notifications": [dict(item) for item in notifications], "atomic": atomic},
            idempotency_key=idempotency_key or self._key("notification-batch"),
        )

    def list_notifications(self, **query: object) -> ApiResponse[object]:
        return self.call_operation("listNotifications", query=query)

    def get_notification(self, public_id: str) -> ApiResponse[object]:
        return self.call_operation("getNotification", path={"public_id": public_id})

    def delete_notification(self, public_id: str, *, recipient_identifier: str, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "deleteNotification",
            path={"public_id": public_id},
            query={"recipient_identifier": self._identifier(recipient_identifier, "recipient_identifier")},
            idempotency_key=idempotency_key or self._key(f"delete-{public_id}"),
        )

    def list_application_notifications(self, application_id: str, **query: object) -> ApiResponse[object]:
        return self.call_operation("listApplicationNotifications", path={"application_id": self._identifier(application_id, "application_id")}, query=query)

    def create_application_notification(self, application_id: str, notification: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "createApplicationNotification",
            path={"application_id": self._identifier(application_id, "application_id")},
            body=dict(notification),
            idempotency_key=idempotency_key or self._key("app-notification"),
        )

    def get_application_notification(self, application_id: str, public_id: str) -> ApiResponse[object]:
        return self.call_operation("getApplicationNotification", path={"application_id": self._identifier(application_id, "application_id"), "public_id": public_id})

    def delete_application_notification(self, application_id: str, public_id: str, *, recipient_identifier: str, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "deleteApplicationNotification",
            path={"application_id": self._identifier(application_id, "application_id"), "public_id": public_id},
            query={"recipient_identifier": self._identifier(recipient_identifier, "recipient_identifier")},
            idempotency_key=idempotency_key or self._key(f"delete-app-{public_id}"),
        )

    def list_user_notifications(self, application_id: str, recipient_identifier: str, **query: object) -> ApiResponse[object]:
        return self.call_operation(
            "listOwnedApplicationNotifications",
            path={"application_id": self._identifier(application_id, "application_id"), "recipient_identifier": self._identifier(recipient_identifier, "recipient_identifier")},
            query=query,
        )

    def create_user_notification(self, application_id: str, recipient_identifier: str, notification: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "createOwnedApplicationNotification",
            path={"application_id": self._identifier(application_id, "application_id"), "recipient_identifier": self._identifier(recipient_identifier, "recipient_identifier")},
            body=dict(notification),
            idempotency_key=idempotency_key or self._key("user-notification"),
        )

    def get_user_notification(self, application_id: str, recipient_identifier: str, public_id: str) -> ApiResponse[object]:
        return self.call_operation(
            "getOwnedApplicationNotification",
            path={"application_id": self._identifier(application_id, "application_id"), "recipient_identifier": self._identifier(recipient_identifier, "recipient_identifier"), "public_id": public_id},
        )

    def delete_user_notification(self, application_id: str, recipient_identifier: str, public_id: str, *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "deleteOwnedApplicationNotification",
            path={"application_id": self._identifier(application_id, "application_id"), "recipient_identifier": self._identifier(recipient_identifier, "recipient_identifier"), "public_id": public_id},
            idempotency_key=idempotency_key or self._key(f"delete-user-{public_id}"),
        )

    def list_group_notifications(self, group_name: str, **query: object) -> ApiResponse[object]:
        return self.call_operation("listGroupedNotifications", path={"group_name": self._group(group_name)}, query=query)

    def create_group_notification(self, group_name: str, notification: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation(
            "createGroupedNotification",
            path={"group_name": self._group(group_name)},
            body=dict(notification),
            idempotency_key=idempotency_key or self._key("group-notification"),
        )

    def cancel_notification(self, public_id: str, *, reason: str = "", expected_version: int | None = None, idempotency_key: str | None = None) -> ApiResponse[object]:
        body: dict[str, object] = {"reason": reason}
        if expected_version is not None:
            body["expected_version"] = expected_version
        return self.call_operation(
            "cancelNotification", path={"public_id": public_id}, body=body, expected_version=expected_version,
            idempotency_key=idempotency_key or self._key(f"cancel-{public_id}"),
        )

    def record_interaction(self, public_id: str, interaction: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation("recordNotificationInteraction", path={"public_id": public_id}, body=dict(interaction), idempotency_key=idempotency_key or self._key("interaction"))

    def issue_realtime_ticket(self, payload: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self.call_operation("issueRealtimeTicket", body=dict(payload), idempotency_key=idempotency_key or self._key("realtime-ticket"))

    def _build_url(self, path_template: str, path_values: Mapping[str, object], query: Mapping[str, object]) -> str:
        required = set(_PATH_PARAMETER_RE.findall(path_template))
        missing = required - set(path_values)
        unknown = set(path_values) - required
        if missing or unknown:
            raise ProtocolError(f"path parameters mismatch; missing={sorted(missing)} unknown={sorted(unknown)}")
        path = path_template
        for name in required:
            path_value = self._identifier(path_values[name], name, maximum=1024)
            path = path.replace("{" + name + "}", urllib.parse.quote(path_value, safe=""))
        pairs: list[tuple[str, str]] = []
        for key, value in query.items():
            if value is None:
                continue
            rendered_key = str(key)
            if not rendered_key or len(rendered_key) > 128 or any(ch in rendered_key for ch in "\r\n\x00"):
                raise ProtocolError("invalid query parameter name")
            values = value if isinstance(value, (list, tuple, set, frozenset)) else [value]
            for item in values:
                rendered = "true" if isinstance(item, bool) and item else "false" if isinstance(item, bool) else str(item)
                if len(rendered) > 4096 or any(ch in rendered for ch in "\r\n\x00"):
                    raise ProtocolError(f"query parameter {rendered_key!r} is invalid")
                pairs.append((rendered_key, rendered))
        suffix = "?" + urllib.parse.urlencode(pairs, doseq=True) if pairs else ""
        return f"{self.config.normalized_base_url}{path}{suffix}"

    def _reject_authority_overrides(self, path: Mapping[str, object], query: Mapping[str, object], body: object | None) -> None:
        forbidden_path = _FORBIDDEN_AUTHORITY_INPUTS & {str(k).casefold() for k in path}
        forbidden_query = _FORBIDDEN_QUERY_INPUTS & {str(k).casefold() for k in query}
        if forbidden_path or forbidden_query:
            raise ProtocolError("tenant/application authority cannot be supplied outside canonical application routes")
        if isinstance(body, Mapping):
            forbidden_body = (_FORBIDDEN_AUTHORITY_INPUTS | {"application_id"}) & {str(k).casefold() for k in body}
            if forbidden_body:
                raise ProtocolError("tenant/application authority cannot be supplied in request bodies")

    def _api_error(self, status: int, raw: bytes, headers: Mapping[str, str]) -> ApiError:
        try:
            decoded = None if not raw else loads_strict(raw, maximum_bytes=self.config.maximum_response_bytes)
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
            if not code and decoded.get("code") is not None:
                code = str(decoded.get("code"))
        cls = {
            401: AuthenticationError, 403: AuthorizationError, 404: NotFoundError, 409: ConflictError,
            412: PreconditionError, 428: PreconditionError, 429: RateLimitError, 503: ServiceUnavailableError,
        }.get(status, ApiError)
        return cls(
            status_code=status,
            message=message[:500],
            request_id=headers.get("x-request-id", "")[:256],
            error_code=code[:128],
            retryable=status in _RETRYABLE_STATUS,
            details=details,
            headers=headers,
        )

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

    @staticmethod
    def _identifier(value: object, name: str, *, maximum: int = 255) -> str:
        rendered = str(value).strip()
        if not rendered or rendered in {".", ".."} or len(rendered) > maximum or any(ch in rendered for ch in "\r\n\x00"):
            raise ProtocolError(f"invalid {name}")
        return rendered

    @classmethod
    def _group(cls, value: object) -> str:
        group = cls._identifier(value, "group_name", maximum=64).casefold()
        if not _GROUP_RE.fullmatch(group):
            raise ProtocolError("group_name must be a safe lowercase notification-group slug")
        return group

    @staticmethod
    def _key(prefix: str) -> str:
        safe = re.sub(r"[^A-Za-z0-9._:@/-]+", "-", prefix)[:72].strip("-") or "request"
        return f"{safe}-{uuid.uuid4()}"[:128]

    def _user_agent(self) -> str:
        suffix = self.config.user_agent_suffix.strip()
        return f"musttip-notifications-python/{SDK_VERSION}" + (f" {suffix}" if suffix else "")


class ApplicationNotificationsClient:
    """Application-pinned SDK view. Server authorization remains authoritative."""

    __slots__ = ("_client", "application_id")

    def __init__(self, client: NotificationsClient, application_id: str) -> None:
        self._client = client
        self.application_id = application_id

    def list(self, **query: object) -> ApiResponse[object]:
        return self._client.list_application_notifications(self.application_id, **query)

    def create(self, notification: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self._client.create_application_notification(self.application_id, notification, idempotency_key=idempotency_key)

    def get(self, public_id: str) -> ApiResponse[object]:
        return self._client.get_application_notification(self.application_id, public_id)

    def delete(self, public_id: str, *, recipient_identifier: str, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self._client.delete_application_notification(
            self.application_id, public_id, recipient_identifier=recipient_identifier, idempotency_key=idempotency_key
        )

    def for_user(self, recipient_identifier: str) -> "UserNotificationsClient":
        return UserNotificationsClient(
            self._client,
            self.application_id,
            self._client._identifier(recipient_identifier, "recipient_identifier"),
        )


class UserNotificationsClient:
    """Application + recipient pinned SDK view for user-owned notification CRUD."""

    __slots__ = ("_client", "application_id", "recipient_identifier")

    def __init__(self, client: NotificationsClient, application_id: str, recipient_identifier: str) -> None:
        self._client = client
        self.application_id = application_id
        self.recipient_identifier = recipient_identifier

    def list(self, **query: object) -> ApiResponse[object]:
        return self._client.list_user_notifications(self.application_id, self.recipient_identifier, **query)

    def create(self, notification: Mapping[str, object], *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self._client.create_user_notification(
            self.application_id, self.recipient_identifier, notification, idempotency_key=idempotency_key
        )

    def get(self, public_id: str) -> ApiResponse[object]:
        return self._client.get_user_notification(self.application_id, self.recipient_identifier, public_id)

    def delete(self, public_id: str, *, idempotency_key: str | None = None) -> ApiResponse[object]:
        return self._client.delete_user_notification(
            self.application_id, self.recipient_identifier, public_id, idempotency_key=idempotency_key
        )
