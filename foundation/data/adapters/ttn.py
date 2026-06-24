"""
ttn — pull The Things Network (TTN) LoRaWAN stats and use them as the SECTOR FACTOR: a token-free
baseline of sector-wide IoT activity that controls for sector beta in the tokenized DePINs
(GEODNET / Helium). (Same LoRaWAN / LPWAN data-plane family as helium — but deliberately NOT a candidate.)

Docs learnings (The Things Network / TTN):
  • TTN (thethingsnetwork.org) is the OPEN-SOURCE, decentralized, largest global LoRaWAN network —
    community-run since 2015, tens of thousands of gateways across 140+ countries. Anyone can add a
    gateway and route uplinks for LoRaWAN devices; the network stats (active gateways, registered
    devices, uplink packets per period) describe sector-wide IoT activity.
  • Crucially TTN has NO TOKEN — there is nothing to trade. So it is NOT a tradeable candidate; it is the
    LoRaWAN SECTOR FACTOR. Helium/GEODNET token dynamics carry sector beta (the whole LPWAN sector rising
    or falling together); regressing on this token-free baseline lets the court isolate the
    asset-specific signal from the sector tide. Access is a network-stats API.

Network is used ONLY on an explicit live call; offline it raises with setup instructions. `demo_fixture`
/ `replay` feed the SAME pipeline real-schema records for the tested floor. (Article 0: no network in the
system path; `run_all` never touches the network.)
"""
import math

import numpy as np

from foundation.security.credentials import resolve as _resolve
from foundation.security import containment

FIELDS = ("t", "gateways", "devices", "uplinks")


class TTNetwork:
    kind = "data"
    name = "ttn"

    def __init__(self, endpoint=None):
        self.endpoint = endpoint if endpoint is not None else _resolve("TTN_API_URL")  # vault -> env

    def describe(self):
        return {"name": self.name, "kind": self.kind,
                "capabilities": ["lorawan-sector", "gateways", "devices", "uplinks", "open-source",
                                 "no-token", "sector-factor"],
                "standard": "The Things Network / LoRaWAN", "token": None}

    def activity(self, since=None, until=None):
        """Live: query the TTN network-stats endpoint for active gateways / registered devices / uplink
        packets over a period — the sector-factor baseline. Raises offline / unconfigured (a
        network-stats client is required). TTN has no token; this is a control, never a candidate."""
        if not self.endpoint:
            raise RuntimeError("ttn: set TTN_API_URL to a Things Network stats endpoint. Offline floor: "
                               "TTNetwork.demo_fixture() / .replay(records).")
        import urllib.parse
        url = "%s/stats" % self.endpoint.rstrip("/")
        q = {k: v for k, v in (("since", since), ("until", until)) if v is not None}
        if q:
            url = url + "?" + urllib.parse.urlencode(q)
        containment.default_policy().guard(url)                 # egress allowlist
        raise RuntimeError("ttn live read needs a network-stats client; configure TTN_API_URL to enable.")

    @staticmethod
    def replay(records):
        return [{k: r.get(k) for k in FIELDS} for r in records]

    @staticmethod
    def demo_fixture(base_t_s=1_718_900_000.0, hours=72, hz=1.0, seed=17):
        """Deterministic network-stats records in TTN's real schema (GPS-time seconds). OFFLINE demo —
        a live network-stats API replaces this. Sector IoT demand is diurnal: busy windows carry more
        uplinks; the active-gateway and registered-device counts drift slowly upward (network growth)."""
        rng = np.random.default_rng(seed)
        n = int(hours * 3600 * hz)
        dt = 1.0 / hz
        gateways = 23_000
        devices = 410_000
        out = []
        for i in range(n):
            busy = (math.sin(i / (n / 8.0) * math.pi) ** 2) > 0.30
            uplinks = int(rng.normal(1400 if busy else 450, 120 if busy else 60))
            uplinks = max(0, uplinks)
            gateways += int(rng.integers(0, 3))                 # community network grows over time
            devices += int(rng.integers(0, 12))
            out.append({"t": base_t_s + i * dt, "gateways": gateways,
                        "devices": devices, "uplinks": uplinks})
        return out


def activity_stream(records, window_s=300):
    """Bucket network-stats records into a timestamped SECTOR-ACTIVITY stream: per window, SUM of uplink
    packets (the sector's packet activity). Returns (t[], activity[]) — the token-free sector factor."""
    if not records:
        return np.array([]), np.array([])
    records = sorted(records, key=lambda r: r["t"])
    t0 = records[0]["t"]
    buckets = {}
    for r in records:
        w = int((r["t"] - t0) // window_s)
        buckets[w] = buckets.get(w, 0) + int(r["uplinks"])
    ws = sorted(buckets)
    return (np.array([t0 + w * window_s for w in ws], float),
            np.array([buckets[w] for w in ws], float))
