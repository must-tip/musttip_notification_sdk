from __future__ import annotations

import json
from importlib.resources import files
from types import MappingProxyType
from typing import Mapping

from .errors import ConfigurationError
from .models import Operation


def _load() -> Mapping[str, Operation]:
    raw = json.loads(files("musttip_notifications.data").joinpath("operations.json").read_text(encoding="utf-8"))
    output: dict[str, Operation] = {}
    for item in raw.get("operations", []):
        operation = Operation(
            operation_id=str(item["operation_id"]),
            method=str(item["method"]),
            path=str(item["path"]),
            required_scopes=tuple(str(value) for value in item.get("required_scopes", [])),
            idempotency_required=bool(item.get("idempotency_required")),
            success_statuses=tuple(int(value) for value in item.get("success_statuses", [])),
        )
        if operation.operation_id in output:
            raise ConfigurationError(f"duplicate operation ID: {operation.operation_id}")
        output[operation.operation_id] = operation
    return MappingProxyType(output)


OPERATIONS = _load()


def get_operation(operation_id: str) -> Operation:
    try:
        return OPERATIONS[operation_id]
    except KeyError as exc:
        raise ConfigurationError(f"unknown notification operation: {operation_id}") from exc
