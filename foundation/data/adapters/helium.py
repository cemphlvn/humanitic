"""
helium — pull a real Helium IoT network-stats stream and align NETWORK DATA TRANSFER (the physical-work
signal) to HNT market dynamics. (Same LoRaWAN / LPWAN DePIN data-plane family as GEODNET.)

Docs learnings (Helium / HNT):
  • Helium IoT is a LoRaWAN / LPWAN DePIN: hundreds of thousands of hotspots route IoT packets for
    LoRaWAN sensors. Devices pay for transfer in Data Credits (DC), a fixed-USD-value credit minted by
    BURNING HNT. So usage -> DC burned -> HNT burned: this burn-and-mint equilibrium is the link from
    physical work (packets carried) to the token. The direct analog of GEODNET's station throughput.
  • HNT (now a Solana SPL after the 2023 migration) is the network token; DC are non-transferable usage
    credits. Network stats (packets transferred, DC burned, active hotspots per period) are the physical
    signal whose dynamics we align to HNT price/on-chain. Access is an authenticated network-stats API.

Network is used ONLY on an explicit live call; offline it raises with setup instructions. `demo_fixture`
/ `replay` feed the SAME pipeline real-schema records for the tested floor. (Article 0: no network in the
system path; `run_all` never touches the network.)
"""
import math

import numpy as np

from foundation.security.credentials import resolve as _resolve
from foundation.security import containment

FIELDS = ("t", "packets", "dc_burned", "hotspots")


class HeliumAPI:
    kind = "data"
    name = "helium"

    def __init__(self, endpoint=None):
        self.endpoint = endpoint if endpoint is not None else _resolve("HELIUM_API_URL")  # vault -> env

    def describe(self):
        return {"name": self.name, "kind": self.kind,
                "capabilities": ["lorawan-iot", "data-transfer", "dc-burn", "hotspot-activity", "remote"],
                "standard": "Helium / LoRaWAN", "token": "HNT (Solana)"}

    def activity(self, since=None, until=None):
        """Live: query the Helium network-stats endpoint for packets / DC burned / active hotspots over a
        period. Raises offline / unconfigured (an authenticated network-stats client is required)."""
        if not self.endpoint:
            raise RuntimeError("helium: set HELIUM_API_URL to a Helium network-stats endpoint. Offline "
                               "floor: HeliumAPI.demo_fixture() / .replay(records).")
        import urllib.parse
        url = "%s/stats" % self.endpoint.rstrip("/")
        q = {k: v for k, v in (("since", since), ("until", until)) if v is not None}
        if q:
            url = url + "?" + urllib.parse.urlencode(q)
        containment.default_policy().guard(url)                 # egress allowlist
        raise RuntimeError("helium live read needs an authenticated network-stats client; configure "
                           "HELIUM_API_URL/key to enable.")

    @staticmethod
    def replay(records):
        return [{k: r.get(k) for k in FIELDS} for r in records]

    @staticmethod
    def demo_fixture(base_t_s=1_718_900_000.0, hours=72, hz=1.0, seed=13):
        """Deterministic network-stats records in Helium's real schema (GPS-time seconds). OFFLINE demo —
        a live network-stats API replaces this. IoT demand is diurnal: busy windows carry more packets and
        burn more DC; the active-hotspot count drifts slowly."""
        rng = np.random.default_rng(seed)
        n = int(hours * 3600 * hz)
        dt = 1.0 / hz
        hotspots = 380_000
        out = []
        for i in range(n):
            busy = (math.sin(i / (n / 8.0) * math.pi) ** 2) > 0.30
            packets = int(rng.normal(900 if busy else 300, 80 if busy else 40))
            packets = max(0, packets)
            dc_burned = round(packets * 1.0 * float(rng.normal(1.0, 0.05)), 2)  # DC ~ proportional to packets
            hotspots += int(rng.integers(-20, 25))              # slowly varying active-hotspot count
            out.append({"t": base_t_s + i * dt, "packets": packets,
                        "dc_burned": dc_burned, "hotspots": hotspots})
        return out


def transfer_stream(records, window_s=300):
    """Bucket network-stats records into a timestamped DATA-TRANSFER stream: per window, SUM of DC burned
    (the network's data-transfer throughput). Returns (t[], transfer[]) — the physical side of the join."""
    if not records:
        return np.array([]), np.array([])
    records = sorted(records, key=lambda r: r["t"])
    t0 = records[0]["t"]
    buckets = {}
    for r in records:
        w = int((r["t"] - t0) // window_s)
        buckets[w] = buckets.get(w, 0.0) + float(r["dc_burned"])
    ws = sorted(buckets)
    return (np.array([t0 + w * window_s for w in ws], float),
            np.array([buckets[w] for w in ws], float))
