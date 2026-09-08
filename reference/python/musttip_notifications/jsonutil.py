from __future__ import annotations

import json
import math
from typing import Any

from .errors import ProtocolError


class DuplicateJsonKey(ValueError):
    pass


def _pairs(pairs: list[tuple[str, object]]) -> dict[str, object]:
    output: dict[str, object] = {}
    for key, value in pairs:
        if key in output:
            raise DuplicateJsonKey(key)
        output[key] = value
    return output


def _constant(value: str) -> object:
    raise ValueError(f"non-finite number {value!r} is forbidden")


def loads_strict(raw: bytes, *, maximum_bytes: int) -> object:
    if len(raw) > maximum_bytes:
        raise ProtocolError("response body exceeds the configured maximum")
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=_pairs, parse_constant=_constant)
    except (UnicodeDecodeError, json.JSONDecodeError, DuplicateJsonKey, ValueError) as exc:
        raise ProtocolError("service returned malformed JSON") from exc


def dumps_bounded(value: object, *, maximum_bytes: int) -> bytes:
    def reject(value: object, depth: int = 0, nodes: list[int] | None = None) -> None:
        if nodes is None:
            nodes = [0]
        nodes[0] += 1
        if nodes[0] > 50_000 or depth > 32:
            raise ProtocolError("request JSON is too complex")
        if isinstance(value, dict):
            for key, item in value.items():
                if not isinstance(key, str) or not key or len(key) > 256 or key.casefold() in {"__proto__", "prototype", "constructor"}:
                    raise ProtocolError("request JSON contains an invalid key")
                reject(item, depth + 1, nodes)
        elif isinstance(value, (list, tuple)):
            if len(value) > 10_000:
                raise ProtocolError("request JSON collection is too large")
            for item in value:
                reject(item, depth + 1, nodes)
        elif isinstance(value, float) and not math.isfinite(value):
            raise ProtocolError("non-finite request numbers are forbidden")
        elif value is not None and not isinstance(value, (str, int, float, bool)):
            raise ProtocolError(f"unsupported JSON type: {type(value).__name__}")
    reject(value)
    try:
        encoded = json.dumps(value, ensure_ascii=False, allow_nan=False, separators=(",", ":")).encode("utf-8")
    except (TypeError, ValueError) as exc:
        raise ProtocolError("request body is not JSON serialisable") from exc
    if len(encoded) > maximum_bytes:
        raise ProtocolError("request body exceeds the configured maximum")
    return encoded
