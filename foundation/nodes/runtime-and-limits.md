# Node — Runtime & Limits (triggerable · autonomous · memory-safe · tunable)

> **TR** — Sistem makinende çalışır: ELLE tetiklenebilir veya OTONOM. Yerel-güvenli (kâğıt, kapılı),
> bellek-güvenli (ayarlanabilir RAM bütçesi; aşınca güvenle DURUR), ayarlanabilir.
> **EN** — The system runs on your machine: TRIGGERABLE or AUTONOMOUS. Local-safe (paper, gated),
> memory-safe (a tunable RAM budget; halts safely when exceeded), tunable.
> **ZH** — 系统在你的机器上运行：可手动触发或自治。本地安全（纸面、门禁）、内存安全（可调 RAM 预算；
> 超限时安全停止）、可调。

**Status:** ADOPTED. Code: `run.sh` · `foundation/runtime/{cli,runner,memory}.py` · launchd plist.

## Trigger it (manual)
```bash
./run.sh once                          # one run
./run.sh status                        # config + RAM budget + current RSS
./run.sh loop --cycles 5 --sleep 60    # a bounded autonomous loop
```

## Autonomous (launchd, native macOS scheduler)
```bash
cp templates/com.humanitik.macro-kernel.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.humanitik.macro-kernel.plist   # runs ./run.sh once on a cadence
```

## Memory-safe & tunable (two layers)
1. **`MemoryGuard`** — reads `resources.max_ram_mb` from your machine config, checks RSS each cycle, and
   **fails safe**: on exceed it raises and the loop **halts** rather than letting the machine OOM.
2. **launchd `HardResourceLimits/ResidentSetSize`** — an OS-level RSS cap in the plist (2 GB default).

Tune both in `.local/machine.yaml` (`resources: { max_ram_mb, interval_seconds, mode }`) and the plist.
macOS `RLIMIT_AS` is unreliable (numpy/MLX reserve large virtual memory), so the guard monitors *actual*
RSS and the OS-level cap is the hard backstop.

## Always local-safe
Every run is **paper by default**, critic-admitted, risk-gated, drawdown-killed, and `.local` is never
published — autonomy never reaches live capital or the outside world without your token.
