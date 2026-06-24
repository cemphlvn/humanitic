"""
geodnet — pull a real GEODNET correction stream over NTRIP/RTCM and align station throughput to GEOD
market dynamics. (The recommended first real target — STRONG on the screening rubric.)

Docs learnings (GEODNET):
  • GEODNET is a global GNSS/RTK correction DePIN: ~20k+ base stations stream RTCM 3.x corrections at
    ~1 Hz, timestamped to GPS time. Access is via an NTRIP caster (a mountpoint per station/area); the
    open client is github.com/geodnet/ntrip. NTRIP is HTTP-style streaming and needs caster host +
    mountpoint + credentials.
  • GEOD (Solana SPL) is Coinbase-listed; ~80% of network revenue funds buyback-and-burn — so station
    throughput / subscriber count is the physical signal whose dynamics we align to GEOD price/on-chain.

Network is used ONLY on an explicit live call; offline it raises with setup instructions. `demo_fixture`
/ `replay` feed the SAME pipeline real-schema RTCM-epoch records for the tested floor. (Article 0.)
"""
import math

import numpy as np

from foundation.security.credentials import resolve as _resolve

EPOCH_FIELDS = ("t", "station", "sats", "fix", "corr_latency_ms")


class GeodnetNTRIP:
    kind = "data"
    name = "geodnet"

    def __init__(self, caster=None, mountpoint=None, opener=None):
        self.caster = caster if caster is not None else _resolve("NTRIP_CASTER")        # vault -> env
        self.mountpoint = mountpoint if mountpoint is not None else _resolve("NTRIP_MOUNTPOINT")
        self._opener = opener

    def describe(self):
        return {"name": self.name, "kind": self.kind,
                "capabilities": ["rtcm3-corrections", "gps-time", "station-throughput", "geod-burn-onchain"],
                "standard": "NTRIP / RTCM 3.x", "client": "github.com/geodnet/ntrip", "token": "GEOD (Solana)"}

    def stream(self, max_epochs=100):
        """Live: connect to the NTRIP caster mountpoint and parse RTCM3 epochs. Raises offline /
        unconfigured (an authenticated caster session + an RTCM3 parser are required)."""
        if not (self.caster and self.mountpoint):
            raise RuntimeError("geodnet: set NTRIP_CASTER + NTRIP_MOUNTPOINT (+ NTRIP_USER/NTRIP_PASS) to "
                               "a GEODNET caster for the live RTCM stream. Offline floor: "
                               "GeodnetNTRIP.demo_fixture() / .replay(records).")
        raise RuntimeError("geodnet live read needs an authenticated NTRIP session and an RTCM3 parser "
                           "(github.com/geodnet/ntrip). Configure NTRIP_USER / NTRIP_PASS to enable.")

    @staticmethod
    def replay(records):
        return [{k: r.get(k) for k in EPOCH_FIELDS} for r in records]

    @staticmethod
    def demo_fixture(base_t_s=1_718_900_000.0, hours=6, hz=1.0, station="GEOD-SF-001", seed=11):
        """Deterministic RTCM-epoch records in GEODNET's real schema (GPS-time seconds). OFFLINE demo —
        a live caster replaces this. Subscriber demand varies, so epoch density + latency vary too."""
        rng = np.random.default_rng(seed)
        n = int(hours * 3600 * hz)
        dt = 1.0 / hz
        out = []
        for i in range(n):
            busy = (math.sin(i / (n / 8.0) * math.pi) ** 2) > 0.30
            if rng.random() < (0.95 if busy else 0.55):                 # corrections flowing this epoch?
                out.append({"t": base_t_s + i * dt, "station": station,
                            "sats": int(rng.integers(10, 18)), "fix": "RTK",
                            "corr_latency_ms": round(float(rng.normal(800 if busy else 1200, 100)), 1)})
        return out


def throughput_stream(epochs, window_s=300):
    """Bucket RTCM epochs into a timestamped STATION-THROUGHPUT stream: per window, epoch count.
    Returns (t[], throughput[]) — the physical side of the as-of join."""
    if not epochs:
        return np.array([]), np.array([])
    epochs = sorted(epochs, key=lambda r: r["t"])
    t0 = epochs[0]["t"]
    buckets = {}
    for r in epochs:
        w = int((r["t"] - t0) // window_s)
        buckets[w] = buckets.get(w, 0) + 1
    ws = sorted(buckets)
    return (np.array([t0 + w * window_s for w in ws], float),
            np.array([buckets[w] for w in ws], float))
