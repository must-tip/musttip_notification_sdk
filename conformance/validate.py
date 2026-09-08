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
    ids = [item["operation_id"] for item in operations["operations"]]
    if len(ids) != len(set(ids)) or len(ids) != 42:
        raise SystemExit("operation catalogue is invalid")
    if openapi["servers"][0]["url"] != "/api/v1/external/notifications":
        raise SystemExit("REST base URL is not canonical v1")
    addresses = {value["address"] for value in asyncapi["channels"].values()}
    expected = {item["path"] for item in manifest["realtime"]["routes"].values()}
    if not expected.issubset(addresses):
        raise SystemExit("AsyncAPI routes do not match the SDK manifest")
    digest = hashlib.sha256((root / "specs/openapi-v1.yaml").read_bytes()).hexdigest()
    print(json.dumps({"status": "valid", "operations": len(ids), "openapi_sha256": digest}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
