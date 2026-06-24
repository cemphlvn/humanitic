"""
frodobots — ingest the FrodoBots-2K embodied dataset (teleoperated sidewalk robots) and surface the
walking-speed / motion-dynamics / time-of-day signals behind the LOCAL-MARKET thesis.

Docs learnings (FrodoBots-2K / BitRobot):
  • ~2,000 hours of teleoperated sidewalk-robot data across 10+ cities (FrodoBots has generated 16k+
    hours, ~half open-sourced). HuggingFace: BitRobot/FrodoBots-2K, CC-BY-SA-4.0.
  • per record: GPS @ ~1 Hz (lat, lon), IMU, front/rear camera, audio, human control @ ~10 Hz, city.
  • BitRobot = the coordination/economic layer (subnets, Verifiable Robotic Work, Embodied Node Tokens).
    NO clean liquid token yet -> PRE-TOKEN embodied-data infrastructure. The core asset is the real-world
    DATA STREAM, not the robot. FIL/SOL/TAO are broad narrative proxies only, not direct beta.

Network-guarded (HF datasets / a local parquet path); offline demo_fixture in the real schema. (Article 0.)
"""
import os
import math

import numpy as np

FRAME_FIELDS = ("t", "city", "lat", "lon", "imu_ax", "imu_ay", "ctrl_throttle", "ctrl_steer")
CITY_SEED = {"berkeley": 1, "sf": 2, "nyc": 3, "tokyo": 4, "seoul": 5}


class FrodoBots2K:
    kind = "data"
    name = "frodobots"

    def __init__(self, path=None):
        self.path = path if path is not None else os.environ.get("FRODOBOTS_2K_PATH")

    def describe(self):
        return {"name": self.name, "kind": self.kind,
                "capabilities": ["embodied", "gps-1hz", "imu", "video", "audio", "control-10hz",
                                 "urban-navigation", "open-cc-by-sa"],
                "dataset": "BitRobot/FrodoBots-2K (HuggingFace)", "license": "CC-BY-SA-4.0",
                "token": "none-yet (pre-token)", "proxies": "FIL/SOL/TAO narrative-only"}

    def frames(self, split=None):
        """Live: read FrodoBots-2K records from a local parquet path. Raises offline / unconfigured."""
        if not self.path:
            raise RuntimeError("frodobots: set FRODOBOTS_2K_PATH to a local FrodoBots-2K parquet/dir "
                               "(download from HuggingFace BitRobot/FrodoBots-2K, CC-BY-SA-4.0). "
                               "Offline floor: FrodoBots2K.demo_fixture() / .replay(records).")
        raise RuntimeError("frodobots: parquet reader not wired (numpy-only path). Point FRODOBOTS_2K_PATH "
                           "at pre-extracted JSON frames or use .replay(records).")

    @staticmethod
    def replay(records):
        return [{k: r.get(k) for k in FRAME_FIELDS} for r in records]

    @staticmethod
    def demo_fixture(city="berkeley", base_t_s=1_718_900_000.0, hours=20, dt_s=15.0, seed=3):
        """Deterministic frames in the FrodoBots-2K schema, with WALKING PACE that varies by TIME OF DAY
        (slow at night, busy at the commute peaks). OFFLINE demo — a live dataset path replaces this."""
        rng = np.random.default_rng(seed + CITY_SEED.get(city, 0))
        n = int(hours * 3600 / dt_s)
        lat, lon = 37.8716, -122.2727
        out = []
        for i in range(n):
            t = base_t_s + i * dt_s
            hour = (t / 3600.0) % 24
            pace = (1.5 + 3.0 * math.exp(-((hour - 9) ** 2) / 8.0)      # morning commute
                    + 2.5 * math.exp(-((hour - 18) ** 2) / 6.0)         # evening commute
                    + 1.0 * math.exp(-((hour - 13) ** 2) / 10.0))       # lunch
            if hour < 6:
                pace *= 0.3                                              # quiet pre-dawn streets
            speed_kmh = max(0.0, pace + rng.normal(0, 0.4))
            dist_km = speed_kmh * (dt_s / 3600.0)
            bearing = rng.uniform(0, 2 * math.pi)
            lat += (dist_km / 111.0) * math.cos(bearing)
            lon += (dist_km / (111.0 * math.cos(math.radians(lat)))) * math.sin(bearing)
            out.append({"t": t, "city": city, "lat": round(lat, 6), "lon": round(lon, 6),
                        "imu_ax": round(float(rng.normal(0, speed_kmh * 0.1)), 3),
                        "imu_ay": round(float(rng.normal(0, speed_kmh * 0.1)), 3),
                        "ctrl_throttle": round(min(1.0, speed_kmh / 6.0), 3),
                        "ctrl_steer": round(float(rng.normal(0, 0.2)), 3)})
        return out
