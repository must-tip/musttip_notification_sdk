from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


class NotificationSdkError(RuntimeError):
    """Base SDK exception."""


class ConfigurationError(NotificationSdkError):
    """SDK configuration is unsafe or incomplete."""


class TransportError(NotificationSdkError):
    """The HTTP transport failed before a valid API response was received."""


class ProtocolError(NotificationSdkError):
    """The service returned malformed or oversized data."""


@dataclass(slots=True)
class ApiError(NotificationSdkError):
    status_code: int
    message: str
    request_id: str = ""
    error_code: str = ""
    retryable: bool = False
    details: object | None = None
    headers: Mapping[str, str] | None = None

    def __str__(self) -> str:
        suffix = f" request_id={self.request_id}" if self.request_id else ""
        return f"HTTP {self.status_code}: {self.message}{suffix}"


class AuthenticationError(ApiError):
    pass


class AuthorizationError(ApiError):
    pass


class NotFoundError(ApiError):
    pass


class ConflictError(ApiError):
    pass


class PreconditionError(ApiError):
    pass


class RateLimitError(ApiError):
    pass


class ServiceUnavailableError(ApiError):
    pass
