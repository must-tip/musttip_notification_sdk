from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import yaml


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate the Must Tip notification SDK contract bundle.")
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()

    manifest = json.loads((root / "sdk-manifest.json").read_text(encoding="utf-8"))
    openapi = yaml.safe_load((root / manifest["api"]["openapi"]).read_text(encoding="utf-8"))
    asyncapi = yaml.safe_load((root / manifest["realtime"]["asyncapi"]).read_text(encoding="utf-8"))
    operations = json.loads((root / "contract/operations.json").read_text(encoding="utf-8"))
    scopes = json.loads((root / "contract/scopes.json").read_text(encoding="utf-8"))

    catalogue_ids = [item["operation_id"] for item in operations["operations"]]
    if len(catalogue_ids) != len(set(catalogue_ids)):
        raise SystemExit("operation catalogue contains duplicate IDs")

    openapi_ids: list[str] = []
    for path_item in openapi["paths"].values():
        for method, operation in path_item.items():
            if method.lower() in {"get", "post", "put", "patch", "delete", "head", "options"} and isinstance(operation, dict):
                openapi_ids.append(operation["operationId"])
    if set(catalogue_ids) != set(openapi_ids):
        raise SystemExit("operation catalogue does not match OpenAPI")
    if openapi["servers"][0]["url"].rstrip("/") != "/api/v1/external/notifications":
        raise SystemExit("REST base URL is not canonical v1")
    if any("tenant_id" in str(item).casefold() for item in operations["operations"]):
        raise SystemExit("operation catalogue exposes tenant authority input")

    known_scopes = {item["name"] for item in scopes["scopes"]}
    referenced_scopes = {scope for item in operations["operations"] for scope in item.get("required_scopes", [])}
    if not referenced_scopes <= known_scopes:
        raise SystemExit("operation catalogue references unknown OAuth scopes")

    addresses = {value["address"] for value in asyncapi["channels"].values()}
    expected = {item["path"] for item in manifest["realtime"]["routes"].values()}
    if not expected.issubset(addresses):
        raise SystemExit("AsyncAPI routes do not match the SDK manifest")

    digest = hashlib.sha256((root / "specs/openapi-v1.yaml").read_bytes()).hexdigest()
    print(json.dumps({"status": "valid", "operations": len(catalogue_ids), "openapi_sha256": digest}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
