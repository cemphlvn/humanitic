#!/usr/bin/env bash
# Minimal first step (research-recommended): run ark in a HARDENED container. Needs Docker/Colima.
#   ./run-contained.sh status | once | mine --target geodnet
# Enforces: read-only root, in-memory /tmp, zero capabilities, no privilege escalation, no network
# (offline), hard RAM/PID caps, and .local as the SINGLE writable mount — no code change required.
cd "$(dirname "$0")" || exit 1
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker/Colima required:  brew install colima docker && colima start --cpu 2 --memory 4" >&2
  exit 1
fi
docker build -q -t ark:dev -f templates/Dockerfile . >/dev/null
exec docker run --rm \
  --read-only --tmpfs /tmp:size=64m,noexec,nosuid,nodev \
  --cap-drop ALL --security-opt no-new-privileges \
  --network none --memory 512m --pids-limit 64 --ulimit nofile=512 \
  -v "$PWD/.local:/app/.local" \
  ark:dev "$@"
