"""
memory — tunable, memory-SAFE limits. RAM usage is bounded by a budget (from the machine config) and
enforced by a guard that checks RSS and FAILS SAFE (raises -> the runner halts) rather than letting the
machine OOM. Best-effort `setrlimit` + `gc` between cycles. macOS-aware: `ru_maxrss` is bytes on Darwin,
KiB on Linux. (For a hard OS-level cap, launchd `HardResourceLimits/ResidentSetSize` — see the plist.)
"""
import sys
import gc
import resource


def current_rss_mb():
    rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss      # PEAK rss (conservative)
    return rss / (1024 * 1024) if sys.platform == "darwin" else rss / 1024


class MemoryGuard:
    def __init__(self, max_ram_mb=2048):
        self.max_ram_mb = float(max_ram_mb)

    def rss_mb(self):
        return current_rss_mb()

    def under_budget(self):
        return self.rss_mb() <= self.max_ram_mb

    def check(self):
        rss = self.rss_mb()
        if rss > self.max_ram_mb:
            raise MemoryError("RAM budget exceeded: %.0f MB > %.0f MB — halting (memory-safe)"
                              % (rss, self.max_ram_mb))
        return rss

    def collect(self):
        gc.collect()

    def try_setrlimit(self):
        """Best-effort hard cap on address space (Linux enforces; macOS often ignores RLIMIT_AS)."""
        try:
            _, hard = resource.getrlimit(resource.RLIMIT_AS)
            cap = int(self.max_ram_mb * 1024 * 1024 * 4)          # generous (numpy/MLX reserve VM)
            resource.setrlimit(resource.RLIMIT_AS, (cap, hard))
            return True
        except (ValueError, OSError):
            return False
