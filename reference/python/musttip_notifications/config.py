from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Callable, Mapping
from types import MappingProxyType
from urllib.parse import urlsplit

from .errors import ConfigurationError

TokenProvider = Callable[[], str]
_SAFE_HEADER_NAME = re.compile(r"^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}$", re.ASCII)
_LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1"})
PROTECTED_HEADERS = frozenset(
    {
        "accept",
        "authorization",
        "connection",
        "content-length",
        "content-type",
        "cookie",
        "host",
        "idempotency-key",
        "if-match",
        "proxy-authorization",
        "transfer-encoding",
        "x-application-id",
        "x-musttip-application-id",
        "x-musttip-sdk-version",
        "x-musttip-tenant-id",
        "x-tenant-id",
    }
)


def validate_extension_headers(headers: Mapping[str, str], *, source: str) -> None:
    for raw_name, raw_value in headers.items():
        name = str(raw_name)
        value = str(raw_value)
        if not _SAFE_HEADER_NAME.fullmatch(name):
            raise ConfigurationError(f"{source} contains an invalid header name")
        if name.casefold() in PROTECTED_HEADERS:
            raise ConfigurationError(f"{source} cannot override protected header {name!r}")
        if not value or "\r" in value or "\n" in value or "\x00" in value or len(value) > 4096:
            raise ConfigurationError(f"{source} contains an invalid header value")


@dataclass(frozen=True, slots=True)
class SdkConfig:
    base_url: str
    access_token: str | TokenProvider = field(repr=False)
    timeout_seconds: float = 10.0
    maximum_attempts: int = 4
    base_retry_delay_seconds: float = 0.25
    maximum_retry_delay_seconds: float = 30.0
    maximum_request_bytes: int = 1_048_576
    maximum_response_bytes: int = 8_388_608
    user_agent_suffix: str = ""
    default_headers: Mapping[str, str] = field(default_factory=dict)
    verify_tls: bool = True

    def __post_init__(self) -> None:
        if not isinstance(self.base_url, str) or any(ord(ch) < 32 or ord(ch) == 127 for ch in self.base_url):
            raise ConfigurationError("base_url contains invalid characters")
        try:
            parsed = urlsplit(self.base_url.strip())
            parsed.port
        except ValueError as exc:
            raise ConfigurationError("base_url is invalid") from exc
        for name in ("maximum_attempts", "maximum_request_bytes", "maximum_response_bytes"):
            if type(getattr(self, name)) is not int:
                raise ConfigurationError(f"{name} must be an integer")
        for name in ("timeout_seconds", "base_retry_delay_seconds", "maximum_retry_delay_seconds"):
            if type(getattr(self, name)) not in (int, float):
                raise ConfigurationError(f"{name} must be a number")
        if type(self.verify_tls) is not bool:
            raise ConfigurationError("verify_tls must be a boolean")
        if parsed.scheme not in {"https", "http"} or not parsed.netloc:
            raise ConfigurationError("base_url must be an absolute HTTP(S) URL")
        if parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ConfigurationError("base_url must not include credentials, query, or fragment")
        if parsed.scheme != "https" and parsed.hostname not in _LOCAL_HOSTS:
            raise ConfigurationError("HTTPS is required outside local development")
        if not self.verify_tls and parsed.hostname not in _LOCAL_HOSTS:
            raise ConfigurationError("TLS verification may be disabled only for localhost development")
        if not 0.1 <= float(self.timeout_seconds) <= 300.0:
            raise ConfigurationError("timeout_seconds must be between 0.1 and 300")
        if not 1 <= int(self.maximum_attempts) <= 10:
            raise ConfigurationError("maximum_attempts must be between 1 and 10")
        if not 0.0 <= float(self.base_retry_delay_seconds) <= 60.0:
            raise ConfigurationError("base_retry_delay_seconds must be between 0 and 60")
        if not float(self.base_retry_delay_seconds) <= float(self.maximum_retry_delay_seconds) <= 300.0:
            raise ConfigurationError("maximum_retry_delay_seconds must be >= base delay and <= 300")
        if not 1_024 <= int(self.maximum_request_bytes) <= 16_777_216:
            raise ConfigurationError("maximum_request_bytes is outside the supported range")
        if not 4_096 <= int(self.maximum_response_bytes) <= 16_777_216:
            raise ConfigurationError("maximum_response_bytes is outside the supported range")
        if len(self.user_agent_suffix) > 256 or any(ch in self.user_agent_suffix for ch in "\r\n\x00"):
            raise ConfigurationError("user_agent_suffix is invalid")
        validate_extension_headers(self.default_headers, source="default_headers")
        object.__setattr__(self, "default_headers", MappingProxyType(dict(self.default_headers)))
        if not isinstance(self.access_token, str) and not callable(self.access_token):
            raise ConfigurationError("access_token must be a string or token provider")
        if isinstance(self.access_token, str) and not self.access_token.strip():
            raise ConfigurationError("access_token must not be empty")

    @property
    def normalized_base_url(self) -> str:
        return self.base_url.strip().rstrip("/")

    def resolve_token(self) -> str:
        value = self.access_token() if callable(self.access_token) else self.access_token
        if not isinstance(value, str):
            raise ConfigurationError("token provider must return a string")
        token = value.strip()
        if not token or len(token) > 16_384 or not re.fullmatch(r"[A-Za-z0-9._~+/-]+=*", token):
            raise ConfigurationError("token provider returned an invalid bearer token")
        return token
