from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, Mapping, TypeVar

T = TypeVar("T")


@dataclass(frozen=True, slots=True)
class ApiResponse(Generic[T]):
    status_code: int
    data: T
    headers: Mapping[str, str]
    request_id: str = ""


@dataclass(frozen=True, slots=True)
class Operation:
    operation_id: str
    method: str
    path: str
    required_scopes: tuple[str, ...]
    idempotency_required: bool
    success_statuses: tuple[int, ...]
