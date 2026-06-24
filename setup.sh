#!/usr/bin/env bash
# ark setup — configure the macro-kernel node locally on a Mac, with recommended defaults.
# UX: preflight → global default (~/.ark) → .local scaffold → Keychain secrets → RLinf (configure/
# register; trains on remote NVIDIA) → verify. Idempotent. Fully flexible. Try: ./setup.sh --dry-run
set -uo pipefail

if [ -t 1 ]; then B=$'\033[1m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; D=$'\033[2m'; X=$'\033[0m'
else B=; G=; Y=; R=; D=; X=; fi
YES=0; DRY=0; RLINF=1
ARK_HOME="${ARK_HOME:-$HOME/.ark}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage(){ cat <<EOF
${B}ark setup${X} — configure the macro-kernel node locally (recommended defaults, fully flexible).

  ./setup.sh [options]
    -y, --yes        accept all recommended defaults (non-interactive)
    -n, --dry-run    preview every action; change nothing
        --no-rlinf   skip the RLinf training integration
    -h, --help       this help

Steps: preflight · global default (~/.ark) · .local scaffold · Keychain secrets · RLinf · verify
EOF
}
while [ $# -gt 0 ]; do case "$1" in
  -y|--yes) YES=1;; -n|--dry-run) DRY=1;; --no-rlinf) RLINF=0;; -h|--help) usage; exit 0;;
  *) echo "${R}unknown option: $1${X}"; usage; exit 1;; esac; shift; done

ok(){ echo "  ${G}✓${X} $*"; }; warn(){ echo "  ${Y}!${X} $*"; }; note(){ echo "  ${D}$*${X}"; }
step(){ echo; echo "${B}── $* ──${X}"; }
run(){ if [ $DRY -eq 1 ]; then echo "  ${D}[dry-run] $*${X}"; else eval "$*"; fi; }
ask(){ [ $YES -eq 1 ] && return 0; printf "  %s ${D}[Y/n]${X} " "$1"
       read -r a </dev/tty 2>/dev/null || a=""; case "$a" in [nN]*) return 1;; *) return 0;; esac; }
have(){ command -v "$1" >/dev/null 2>&1; }

step "1 · preflight"
for t in python3 git; do have "$t" && ok "$t" || { echo "  ${R}✗ $t required${X}"; exit 1; }; done
python3 -c "import numpy" 2>/dev/null && ok "numpy" || warn "numpy missing (pip install numpy)"
have openssl && ok "openssl (encrypted-file fallback)" || warn "openssl not found"
have security && ok "macOS Keychain (Secure-Enclave-backed secrets)" || warn "Keychain unavailable"
python3 -c "import mlx.core" 2>/dev/null && ok "MLX (Metal acceleration)" || note "MLX optional — pip install mlx"

step "2 · global default  ${D}($ARK_HOME)${X}"
if ask "install recommended global defaults to $ARK_HOME?"; then
  run "mkdir -p '$ARK_HOME/templates'"
  run "cp '$HERE/ark.machine.example.yaml' '$ARK_HOME/templates/machine.yaml'"
  run "cp '$HERE/templates/WELCOME.template.md' '$ARK_HOME/templates/WELCOME.md'"
  run "printf 'ark_home: %s\nnode: macro-kernel\ndefault_machine: templates/machine.yaml\n' '$ARK_HOME' > '$ARK_HOME/config.yaml'"
  ok "global defaults installed"
else note "skipped"; fi

step "3 · your private .local  ${D}(Article 0 — never committed, never published)${X}"
if ask "scaffold your .local vault here?"; then
  run "PYTHONPATH='$HERE' python3 -c \"from foundation.personal_os import scaffold; scaffold('.local')\""
  [ -f .local/machine.yaml ] || run "cp '$HERE/ark.machine.example.yaml' .local/machine.yaml"
  [ -f .local/WELCOME.md ]   || run "cp '$HERE/templates/WELCOME.template.md' .local/WELCOME.md"
  ok ".local scaffolded (vault/ theses/ calibration/ index.local/ machine.yaml WELCOME.md)"
else note "skipped"; fi

step "4 · secrets  ${D}(encrypted at rest — never plaintext)${X}"
if have security; then
  note "store keys in the Keychain (device-only, not echoed to history) — run these yourself:"
  for k in cdp/api_key_id cdp/api_key_secret cdp/wallet_secret; do
    note "  security add-generic-password -s ark -a $k -w"; done
  note "(the setup never handles your key values)"
else
  note "no Keychain — set secrets.backend: encrypted-file in .local/machine.yaml (Fernet, passphrase in keychain/env)"
fi

if [ $RLINF -eq 1 ]; then
  step "5 · RLinf training  ${D}(github.com/RLinf/RLinf — runs on remote NVIDIA, not this Mac)${X}"
  note "RLinf needs Linux + NVIDIA GPUs (CUDA). On a Mac we configure + register it; training runs remote."
  note "reward = deployment-consistent: a strategy's RL reward = surviving ark's evidence court."
  if ask "clone RLinf for reference + write the recommended config?"; then
    run "git clone --depth 1 https://github.com/RLinf/RLinf '$ARK_HOME/rlinf' 2>/dev/null || (cd '$ARK_HOME/rlinf' && git pull --ff-only)"
    run "PYTHONPATH='$HERE' python3 -c \"import json; from foundation.training.rlinf import RECOMMENDED; open('$ARK_HOME/rlinf.config.json','w').write(json.dumps(RECOMMENDED, indent=2))\""
    ok "RLinf cloned + recommended config -> $ARK_HOME/rlinf.config.json"
    note "train on a GPU box: pip install rlinf (or RLinf's Docker), point the adapter's remote= at it"
  else note "skipped"; fi
fi

step "6 · verify"
if [ $DRY -eq 0 ]; then
  PYTHONPATH="$HERE" python3 -m foundation.selftest >/dev/null 2>&1 && ok "floor green" || warn "selftest failed"
  PYTHONPATH="$HERE" python3 run_health.py -q --no-write && ok "health PASS" || warn "health not PASS"
else note "[dry-run] would run selftest + run_health"; fi

echo; echo "${B}done.${X}"
note "next: edit .local/machine.yaml · add keys to the Keychain · run your OS (paper, gated)."
