# Node — Containment (its own secure environment, interface-only)

> **TR** — Evet, yapılabilir. Sistem kendi kapsanmış ortamıdır: yalnız ARAYÜZ üzerinden etkileşim, yalnız
> izin-listesi uç noktalara çıkış, yazma yalnız `.local`/scratch, RAM/CPU sınırları; OS yalıtımı
> sandbox-exec (mac) / konteyner (prod). Derinlemesine savunma.
> **EN** — Yes, we can. The system is its own contained environment: interaction ONLY through the
> interface, egress ONLY to an allowlist, writes ONLY to `.local`/scratch, RAM/CPU caps; OS isolation via
> sandbox-exec (mac) / a container (prod). Defense in depth.
> **ZH** — 可以做到。系统是自身的受限环境：仅通过接口交互、仅向白名单出站、仅写入 `.local`/scratch、
> RAM/CPU 上限；OS 隔离用 sandbox-exec（mac）/ 容器（生产）。纵深防御。

**Status:** ADOPTED (in-process layer). Code: `foundation/security/containment.py`. Check: `./run.sh contain`.
OS isolation: `templates/ark.sb` (macOS), `templates/Dockerfile` (prod), `run-sandboxed.sh`.

## Can we do it? Yes — defense in depth, four in-process layers + OS isolation
| layer | mechanism | what it stops |
|---|---|---|
| **interface boundary** | sole entry = `run.sh` → `foundation.runtime.cli`; interact via commands | ad-hoc internal access; everything goes through one gate |
| **egress allowlist** | `EgressPolicy.guard(url)` — LAN/localhost + allowlisted public only; default-deny | data exfiltration / calling arbitrary hosts |
| **filesystem confinement** | `assert_confined` — writes only under `.local/` + scratch | touching the rest of the host |
| **resource limits** | `MemoryGuard` (RAM, fails safe) + setrlimit | runaway memory/CPU blast radius |
| **secrets** | `SecretVault` (Keychain/Secure Enclave/encrypted) | plaintext keys, leaks |

## OS-level isolation (the strong layer)
- **macOS dev:** `./run-sandboxed.sh once` — a `sandbox-exec` (Seatbelt) jail: **no network** (offline) and
  writes confined to the repo. Best-effort (Seatbelt can't allowlist per-host).
- **Production:** `templates/Dockerfile` — non-root, `--read-only`, `--network none` (offline) or an
  **allowlisting egress proxy** (live), secrets mounted at runtime (never baked in), `--memory/--cpus/
  --pids-limit`. The container ENTRYPOINT is the CLI — the **sole interface**.

## The honest caveat
App-level guards (this module) are **necessary but not sufficient** alone — a determined in-process
bug could bypass them. Real isolation is the OS layer (container/microVM). The recommended posture: the
in-process guards for every run, the container for anything live or money-touching. (Best-practice
architecture from the parallel containment research is folded into this node as it lands.)
