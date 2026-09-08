#!/usr/bin/env sh
set -eu
if [ "$#" -lt 2 ]; then
  echo "usage: $0 <language> <output-directory>" >&2
  exit 64
fi
exec python3 "$(dirname "$0")/generate.py" "$1" --output "$2" --clean
