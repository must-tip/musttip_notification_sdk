#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
PYTHON="${PYTHON:-../.venv/bin/python}"
"$PYTHON" -m ruff check reference/python tests --select E4,E7,E9,F
"$PYTHON" -m mypy --follow-imports=silent reference/python/musttip_notifications
"$PYTHON" conformance/validate.py
"$PYTHON" -m pytest tests "$@"
npm --prefix reference/typescript test
