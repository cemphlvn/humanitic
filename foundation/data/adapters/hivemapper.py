"""
hivemapper — pull a real Hivemapper physical-activity stream from the open ODC (Open Dashcam) API and
align it to HONEY market dynamics.

Docs learnings (Hivemapper / Bee Maps):
  • The ODC API is OPEN-SOURCE (github.com/Hivemapper/odc-api), served by the dashcam on the LAN.
    `GET /gps` returns GPS samples {lat, lon, alt, speed, timestamp (epoch ms), sats}; it supports
    since/until time filters. `GET /framekm` and `GET /frames` expose imagery metadata.
  • The Bee Maps cloud API serves map coverage by H3 hexcell (API-key auth).
  • HONEY (Solana SPL) burns when map credits are purchased (MIP-24 moved the reward epoch to upload
    time) — the on-chain market signal whose dynamics we align the physical-coverage stream to.

Network is used ONLY on an explicit live call; offline it raises with setup instructions. `demo_fixture`
/ `replay` feed the SAME pipeline real-schema records for the tested floor. (Article 0: no network in the
system path; `run_all` never touches the network.)
"""
import os
import json
import math

import numpy as np

GPS_FIELDS = ("t", "lat", "lon", "alt", "speed", "sats")


class HivemapperODC:
    kind = "data"
    name = "hivemapper"

    def __init__(self, base_url=None, opener=None):
        self.base_url = base_url if base_url is not None else os.environ.get("ODC_API_URL")
        self._opener = opener                                   # injectable for tests; None -> urllib

    def describe(self):
        return {"name": self.name, "kind": self.kind,
                "capabilities": ["gps-trajectory", "dashcam-video", "honey-burn-onchain"],
                "endpoints": ["GET /gps", "GET /framekm", "GET /frames"],
                "standard": "odc-api (open source)", "token": "HONEY (Solana)"}

    def gps(self, since=None, until=None):
        """Live: GET {base_url}/gps?since=&until= -> GPS samples. Raises offline / unconfigured."""
        if not self.base_url:
            raise RuntimeError("hivemapper: set ODC_API_URL (or base_url) to a reachable ODC device for "
                               "GET /gps. Offline floor: HivemapperODC.demo_fixture() / .replay(records).")
        import urllib.request
        import urllib.parse
        url = "%s/gps" % self.base_url.rstrip("/")
        q = {k: v for k, v in (("since", since), ("until", until)) if v is not None}
        if q:
            url = url + "?" + urllib.parse.urlencode(q)
        opener = self._opener or urllib.request.urlopen
        with opener(url, timeout=10) as resp:
            rows = json.loads(resp.read().decode())
        return [{k: r.get(k) for k in GPS_FIELDS} for r in rows]

    @staticmethod
    def replay(records):
        return [{k: r.get(k) for k in GPS_FIELDS} for r in records]

    @staticmethod
    def demo_fixture(base_t_ms=1_718_900_000_000, hours=6, hz=0.2, seed=7):
        """Deterministic GPS samples in the real ODC /gps schema (epoch ms). OFFLINE demo only — a live
        ODC device replaces this. Physical activity comes in clustered drives (bursts, then idle)."""
        rng = np.random.default_rng(seed)
        n = int(hours * 3600 * hz)
        dt = int(1000 / hz)
        lat, lon = 37.7749, -122.4194
        out = []
        for i in range(n):
            moving = (math.sin(i / (n / 8.0) * math.pi) ** 2) > 0.35
            step = 0.0009 if moving else 0.0
            lat += rng.normal(0, step)
            lon += rng.normal(0, step)
            out.append({"t": base_t_ms + i * dt, "lat": round(lat, 6), "lon": round(lon, 6),
                        "alt": 10.0, "speed": round(8.0 * step * 1000, 2), "sats": int(rng.integers(8, 14))})
        return out


def _haversine_km(a, b):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def activity_stream(gps, window_ms=300000):
    """Bucket GPS samples into a timestamped PHYSICAL-ACTIVITY stream: per window, km covered (haversine).
    Returns (t[], activity[]) — the robot/physical side of the as-of join."""
    if not gps:
        return np.array([]), np.array([])
    gps = sorted(gps, key=lambda r: r["t"])
    t0 = gps[0]["t"]
    buckets, prev = {}, None
    for r in gps:
        w = (r["t"] - t0) // window_ms
        buckets.setdefault(w, 0.0)
        if prev is not None:
            buckets[w] += _haversine_km((prev["lat"], prev["lon"]), (r["lat"], r["lon"]))
        prev = r
    ws = sorted(buckets)
    return (np.array([t0 + w * window_ms for w in ws], float),
            np.array([buckets[w] for w in ws], float))
