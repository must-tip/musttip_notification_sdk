from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "generator" / "configs"
SPEC = ROOT / "specs" / "openapi-v1.yaml"


def available_languages() -> list[str]:
    return sorted(path.stem for path in CONFIG_DIR.glob("*.json"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a Must Tip notification client from the canonical OpenAPI contract.")
    parser.add_argument("language", choices=available_languages())
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--cli", default="openapi-generator-cli", help="OpenAPI Generator executable on PATH")
    parser.add_argument("--clean", action="store_true", help="Remove the output directory before generation")
    args = parser.parse_args()

    cli = shutil.which(args.cli)
    if cli is None:
        parser.error(
            f"{args.cli!r} is not available. Install OpenAPI Generator and pin its version in your build environment."
        )
    config_path = CONFIG_DIR / f"{args.language}.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    generator_name = config["generatorName"]
    additional = config.get("additionalProperties", {})
    if args.clean and args.output.exists():
        shutil.rmtree(args.output)
    args.output.mkdir(parents=True, exist_ok=True)
    command = [
        cli,
        "generate",
        "-i",
        str(SPEC),
        "-g",
        generator_name,
        "-o",
        str(args.output),
        "--additional-properties",
        ",".join(f"{key}={str(value).lower() if isinstance(value, bool) else value}" for key, value in additional.items()),
    ]
    completed = subprocess.run(command, check=False)
    return int(completed.returncode)


if __name__ == "__main__":
    raise SystemExit(main())
