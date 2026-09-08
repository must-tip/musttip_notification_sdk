from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Callable, Mapping
from urllib.parse import urlsplit

from .errors import ConfigurationError

TokenProvider = Callable[[], str]
_SAFE_HEADER_NAME = re.compile(r"^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}$", re.ASCII)


@dataclass(frozen=True, slots=True)
class SdkConfig:
    base_url: str
    access_token: str | TokenProvider
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
        parsed = urlsplit(self.base_url.strip())
        if parsed.scheme not in {"https", "http"} or not parsed.netloc:
            raise ConfigurationError("base_url must be an absolute HTTP(S) URL")
        if parsed.username or parsed.password or parsed.query or parsed.fragment:
            raise ConfigurationError("base_url must not include credentials, query, or fragment")
        if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise ConfigurationError("HTTPS is required outside local development")
        if not 0.1 <= float(self.timeout_seconds) <= 300.0:
            raise ConfigurationError("timeout_seconds must be between 0.1 and 300")
        if not 1 <= int(self.maximum_attempts) <= 10:
            raise ConfigurationError("maximum_attempts must be between 1 and 10")
        if not 4_096 <= int(self.maximum_response_bytes) <= 16_777_216:
            raise ConfigurationError("maximum_response_bytes is outside the supported range")
        for name, value in self.default_headers.items():
            if not _SAFE_HEADER_NAME.fullmatch(str(name)):
                raise ConfigurationError("default_headers contains an invalid header name")
            if "\r" in str(value) or "\n" in str(value) or len(str(value)) > 4096:
                raise ConfigurationError("default_headers contains an invalid header value")
        if isinstance(self.access_token, str) and not self.access_token.strip():
            raise ConfigurationError("access_token must not be empty")

    @property
    def normalized_base_url(self) -> str:
        return self.base_url.rstrip("/")

    def resolve_token(self) -> str:
        value = self.access_token() if callable(self.access_token) else self.access_token
        token = str(value or "").strip()
        if not token or len(token) > 16_384 or any(ch.isspace() for ch in token):
            raise ConfigurationError("token provider returned an invalid bearer token")
        return token
