"""
sources — research-grade SOURCE ALLOCATION following OPEN protocols.

Each source is a card in an open, portable shape: dataset metadata as MLCommons **Croissant**, robot
episodes as **RLDS** (Open-X-Embodiment), market frames as OHLC, provenance/lineage as **OpenLineage**,
storage as **Parquet/Arrow**. Each carries an OPEN license, a quality TIER, and provenance — research-
grade data management. `allocate_walkforward` splits a stream by TIME with NO leakage (expanding window;
every test index strictly after every train index — the discipline an honest eval requires).
"""
from collections import namedtuple

Source = namedtuple("Source", "id modality provenance license fmt standard tier")

# research-grade, OPEN sources only (no proprietary feeds in the floor)
CATALOG = [
    Source("stooq",             "market", "stooq.com",              "open",          "ohlc",    "croissant", "research"),
    Source("fred",              "market", "fred.stlouisfed.org",    "public-domain", "parquet", "croissant", "research"),
    Source("open-x-embodiment", "robot",  "robotics-transformer-x", "open",          "rlds",    "croissant", "research"),
    Source("robotwin",          "robot",  "RoboTwin-Platform",      "open",          "rlds",    "croissant", "research"),
    Source("droid",             "robot",  "droid-dataset",          "open",          "rlds",    "croissant",  "research"),
    Source("coingecko",         "crypto", "coingecko.com",          "open",          "ohlc",    "croissant",  "research"),
    Source("defillama",         "crypto", "defillama.com",          "open",          "parquet", "croissant",  "research"),
    Source("base-rpc",          "crypto", "base.org",               "open",          "onchain", "openlineage", "research"),
]


def by_modality(modality):
    return [s for s in CATALOG if s.modality == modality]


Split = namedtuple("Split", "train val test")          # each is a range of time-ordered indices


def allocate_walkforward(n, train=0.6, val=0.2, test=0.2):
    """Expanding walk-forward allocation by TIME. Returns index ranges; train < val < test (no leakage)."""
    assert abs(train + val + test - 1.0) < 1e-9, "allocations must sum to 1"
    a = int(n * train)
    b = int(n * (train + val))
    return Split(range(0, a), range(a, b), range(b, n))


def assert_no_leakage(split):
    """No future leaks into the past: every val/test index strictly after every train index."""
    tr, va, te = list(split.train), list(split.val), list(split.test)
    assert not (tr and va) or max(tr) < min(va), "val leaks into train"
    assert not (va and te) or max(va) < min(te), "test leaks into val"
    assert not (tr and te) or max(tr) < min(te), "test leaks into train"
    return True
