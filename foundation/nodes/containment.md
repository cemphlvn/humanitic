# Node — Containment (its own secure environment, interface-only)

> **TR** — Evet, yapılabilir. Derinlemesine savunma: iş-mantığı kapıları → OS izolasyonu → konteyner/VM →
> ağ izolasyonu → broker-tarafı sermaye kapısı. Sistem yalnız ARAYÜZ üzerinden, yalnız izin-listesine
> çıkışla, yalnız `.local`'e yazarak çalışır.
> **EN** — Yes, we can. Defense in depth: business-logic gates → OS isolation → container/VM → network
> isolation → broker-side capital gate. The system runs interactable ONLY through the interface, egress
> ONLY to an allowlist, writes ONLY to `.local`.
> **ZH** — 可以。纵深防御：业务逻辑门 → OS 隔离 → 容器/VM → 网络隔离 → 券商侧资金门。系统仅通过接口交互、
> 仅向白名单出站、仅写入 `.local`。

**Status:** ADOPTED. In-process: `foundation/security/containment.py` (`./run.sh contain`). OS layer:
`run-contained.sh` (hardened container) · `templates/{Dockerfile,docker-compose.yaml,ark.sb}`.
Architecture from parallel security research (June 2026).

## Threat model (a system that can spend money)
1. **Accidental blast radius** — calls a wrong endpoint / overspends. *Most likely now.* → egress allowlist, paper gate, resource caps.
2. **Secret exfiltration** — creds/positions leak via logs/env/egress. → secrets-never-in-env, Article 0, fs confinement.
3. **Privilege escalation** — escapes the box / gains caps. → non-root, read-only FS, no-new-privileges, seccomp.
4. **Supply chain** — a dep (even numpy) goes hostile. → isolation depth (container/microVM).
Modes 1–2 dominate today. **App-level guards run *inside* the blast radius — necessary, not sufficient.**

## Defense in depth — five independent layers
| layer | controls | survives |
|---|---|---|
| **0 business logic** | paper gate · publish_guard (Article 0) · MemoryGuard · `containment.py` (egress/fs) | until the process is compromised |
| **1 OS process** | non-root · `--cap-drop ALL` · `no-new-privileges` · read-only FS · seccomp | until a kernel bug |
| **2 container/VM** | Apple Container / Lima VM (separate kernel) · userns remap · cgroups hard caps | until a hypervisor bug |
| **3 network** | network-namespace default-deny + **Squid allowlist proxy** + DNS pinning | *first truly independent* — survives host compromise |
| **4 capital gate** | **broker-side IP allowlist + position limits + human approval** | survives even full machine compromise |
Layer 4 is **non-negotiable before live capital** — set it at the broker, not just in ark.

## macOS options (dev)
- **Colima + Docker (recommended now):** a Linux VM with the full stack (cgroups v2, nftables, seccomp). `./run-contained.sh` builds + runs the hardened container.
- **Apple Container v1.0.0 (new):** per-container VM via Virtualization.framework — strongest macOS-native isolation; same OCI image (the cleanest path as `sandbox-exec` is deprecated).
- **`sandbox-exec` (Seatbelt):** `./run-sandboxed.sh` — kernel MAC jail, deny-network offline. Deprecated but works; belt-and-suspenders only.

## Egress for live data (Layer 3)
App-level allowlist isn't enough alone. For live feeds: ark on an `internal` network → a **Squid** sidecar
whose ACL permits ONLY the NTRIP caster host:port + the specific APIs → everything else 403'd and logged.
NTRIP/RTCM over TCP uses Squid's CONNECT. See the commented `squid` service in `docker-compose.yaml`.

## Secrets in the box
Never in env/image/logs. `run.sh` reads the Keychain at launch and writes to a **tmpfs** (RAM-only) mount
the container reads as a file; destroyed on exit. The broker/withdraw token gets the shortest TTL, minimum
scope, and is **never mounted during paper/backtest**.

## Minimal first step (research-recommended, ~2h)
```bash
brew install colima docker && colima start --cpu 2 --memory 4
./run-contained.sh status     # builds ark:dev, runs --read-only --cap-drop ALL --no-new-privileges
                              # --network none --memory 512m --pids-limit 64, .local the only writable mount
```
One invocation → read-only root, in-memory /tmp, zero capabilities, no privilege escalation, no network
(offline), hard RAM/PID caps, single `.local` mount. A real containment layer for a numpy-only app, no code
change. When live data is added, swap `--network none` for the Squid-proxied internal network.
