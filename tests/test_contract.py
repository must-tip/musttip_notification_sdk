from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
PYTHON_REF = ROOT / "reference" / "python"
sys.path.insert(0, str(PYTHON_REF))

from musttip_notifications import (  # noqa: E402
    EXTERNAL_DEVELOPER,
    EXTERNAL_RECIPIENT,
    NotificationsClient,
    ProtocolError,
    SdkConfig,
    build_request,
    parse_message,
    recipient_ticket_subprotocols,
    sign_event_payload,
    verify_event_payload,
)
from musttip_notifications.catalog import OPERATIONS  # noqa: E402


def _openapi() -> dict:
    return yaml.safe_load((ROOT / "specs/openapi-v1.yaml").read_text(encoding="utf-8"))


def _asyncapi() -> dict:
    return yaml.safe_load((ROOT / "specs/asyncapi-v1.yaml").read_text(encoding="utf-8"))


def test_rest_contract_is_versioned_and_complete() -> None:
    spec = _openapi()
    assert spec["openapi"].startswith("3.1")
    assert spec["servers"][0]["url"] == "/api/v1/external/notifications"
    operation_ids = []
    for path_item in spec["paths"].values():
        for method, operation in path_item.items():
            if method.lower() in {"get", "post", "put", "patch", "delete"}:
                operation_ids.append(operation["operationId"])
    assert len(operation_ids) == 42
    assert len(operation_ids) == len(set(operation_ids))
    assert set(operation_ids) == set(OPERATIONS)


def test_mutations_have_idempotency_contract_except_safe_preview() -> None:
    non_idempotent_mutations = [
        operation.operation_id
        for operation in OPERATIONS.values()
        if operation.method not in {"GET", "HEAD", "OPTIONS"} and not operation.idempotency_required
    ]
    assert non_idempotent_mutations == ["previewTemplate"]


def test_realtime_routes_and_subprotocols_are_versioned() -> None:
    spec = _asyncapi()
    addresses = {channel["address"] for channel in spec["channels"].values()}
    assert EXTERNAL_DEVELOPER.path in addresses
    assert EXTERNAL_RECIPIENT.path in addresses
    assert EXTERNAL_DEVELOPER.subprotocol.endswith(".v1")
    assert EXTERNAL_RECIPIENT.subprotocol.endswith(".v1")


def test_operation_catalog_has_no_tenant_authority_parameters() -> None:
    raw = json.loads((ROOT / "contract/operations.json").read_text())
    for operation in raw["operations"]:
        names = {p["name"] for p in operation["path_parameters"] + operation["query_parameters"]}
        assert "tenant_id" not in names
        assert "application_id" not in names


def test_event_signature_vector_matches_reference() -> None:
    vector = json.loads((ROOT / "conformance/fixtures/event-signature-vector.json").read_text())
    payload = vector["payload_utf8"].encode("utf-8")
    assert sign_event_payload(payload, secret=vector["secret"], key_id=vector["key_id"]) == vector["headers"]
    assert verify_event_payload(payload, vector["headers"], secrets={vector["key_id"]: vector["secret"]}) is True


def test_event_signature_rejects_tampering() -> None:
    vector = json.loads((ROOT / "conformance/fixtures/event-signature-vector.json").read_text())
    try:
        verify_event_payload(vector["payload_utf8"].encode() + b"x", vector["headers"], secrets={vector["key_id"]: vector["secret"]})
    except ProtocolError:
        pass
    else:
        raise AssertionError("tampered event payload was accepted")


def test_realtime_request_and_ticket_contract() -> None:
    request = build_request(
        "external.notification.create",
        {"recipient_identifier": "customer-1"},
        request_id="req-01",
        idempotency_key="notification-01",
    )
    decoded = json.loads(request)
    assert decoded["protocol_version"] == 1
    assert decoded["idempotency_key"] == "notification-01"
    protocols = recipient_ticket_subprotocols("ticket-value-that-is-long-enough")
    assert protocols[0] == EXTERNAL_RECIPIENT.subprotocol
    assert protocols[1].startswith("musttip.notification-ticket.")


def test_realtime_parser_rejects_unknown_version() -> None:
    try:
        parse_message('{"protocol_version":2,"type":"notification.event"}')
    except ProtocolError:
        pass
    else:
        raise AssertionError("unsupported protocol version was accepted")


def test_python_client_requires_idempotency_for_mutations() -> None:
    client = NotificationsClient(SdkConfig(base_url="https://notifications.example.com/api/v1/external/notifications", access_token="abc.def.ghi"))
    try:
        client.call_operation("createNotification", body={})
    except ProtocolError:
        pass
    else:
        raise AssertionError("mutation without idempotency was accepted")


def test_codegen_profiles_cover_declared_targets() -> None:
    manifest = json.loads((ROOT / "sdk-manifest.json").read_text())
    configs = {path.stem for path in (ROOT / "generator/configs").glob("*.json")}
    assert set(manifest["generated_client_targets"]) == configs


def test_all_json_contract_files_parse() -> None:
    for path in [*ROOT.glob("contract/*.json"), *ROOT.glob("specs/json-schema/*.json"), *ROOT.glob("generator/configs/*.json")]:
        json.loads(path.read_text(encoding="utf-8"))



def _resolve_local_ref(document: object, reference: str) -> object:
    assert reference.startswith("#/"), reference
    current = document
    for part in reference[2:].split("/"):
        key = part.replace("~1", "/").replace("~0", "~")
        assert isinstance(current, dict), reference
        assert key in current, reference
        current = current[key]
    return current


def test_all_local_openapi_and_asyncapi_refs_resolve() -> None:
    for document in (_openapi(), _asyncapi()):
        stack = [document]
        while stack:
            value = stack.pop()
            if isinstance(value, dict):
                reference = value.get("$ref")
                if isinstance(reference, str) and reference.startswith("#/"):
                    _resolve_local_ref(document, reference)
                stack.extend(value.values())
            elif isinstance(value, list):
                stack.extend(value)


def test_json_schema_fixtures_validate() -> None:
    import jsonschema

    schemas = ROOT / "specs/json-schema"
    event_schema = json.loads((schemas / "event-envelope.schema.json").read_text())
    request_schema = json.loads((schemas / "realtime-request.schema.json").read_text())
    event = json.loads((ROOT / "conformance/fixtures/valid-event-envelope.json").read_text())
    request = json.loads((ROOT / "conformance/fixtures/valid-realtime-request.json").read_text())
    jsonschema.Draft202012Validator(event_schema).validate(event)
    jsonschema.Draft202012Validator(request_schema).validate(request)
