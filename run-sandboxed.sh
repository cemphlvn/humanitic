#!/usr/bin/env bash
# Run ark inside a macOS sandbox-exec jail (OFFLINE profile: no network; writes confined to the repo).
# Production-strength containment is the container (templates/Dockerfile). Best-effort on macOS.
cd "$(dirname "$0")" || exit 1
if ! command -v sandbox-exec >/dev/null 2>&1; then
  echo "sandbox-exec not found; use the container (templates/Dockerfile) for containment." >&2
  exit 1
fi
exec sandbox-exec -D REPO="$PWD" -f templates/ark.sb ./run.sh "$@"
