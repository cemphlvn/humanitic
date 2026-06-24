#!/usr/bin/env bash
# ark run — trigger the macro-kernel:  ./run.sh once | loop [--cycles N --sleep S] | status
# Local-safe (paper, gated), memory-safe (tunable RAM budget, fails safe), tunable (machine.yaml).
cd "$(dirname "$0")" || exit 1
exec env PYTHONPATH=. python3 -m foundation.runtime.cli "$@"
