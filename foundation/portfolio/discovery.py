"""
discovery — the REAL edge-FINDER candidate source for the portfolio-of-edges book.

WHY this exists: breadth is only real when the bets are uncorrelated (IR = IC·√breadth, and ten copies
of one edge are one edge). Re-seeding a SINGLE generator gives candidates that share a generative
mechanism — same world, same shocks — so their orthogonality is cosmetic and collapses under a regime
change. The honest fix is to source candidates from genuinely DIFFERENT finders: distinct data streams,
distinct features, distinct planted lead-lag. Different finders are orthogonal by construction, not by
luck. So this module replaces one generator with MULTIPLE finder SOURCES, each its own physical read.

This is the `candidate()` seam a live feed / P2P contributor network plugs into: every source here is a
`fn(seed) -> 1D per-bar P&L`, and the SAME finders run on LIVE data the moment a real stream is
configured (a GEODNET caster, a FrodoBots parquet, a real market series). What you see here is
SYNTHETIC REPLAY — each fixture is deterministic and offline (Article 0: no network, no .local writes),
with a MODEST planted edge (target per-source Sharpe ≈ 0.15–0.3) so the finders have a real, small signal
to discover rather than a fantasy one. The point is not the synthetic Sharpe; it is that three
independent finders produce cross-source-orthogonal streams the book can actually earn breadth from.

The three finders, each a different read of the world:
  • regime  — unsupervised k-means regime discovery + walk-forward dynamic trading (a hidden state edge).
  • pace    — embodied sidewalk-robot WALKING-PACE anomaly (deseasonalized) leading a local market.
  • geodnet — GNSS/RTK correction-network station THROUGHPUT leading its token's dynamics.

Pure numpy, deterministic. A DISTINCT rng offset per source keeps the planted-market noise uncorrelated
across sources AND seeds, so two finders never accidentally share a draw.
"""
import numpy as np

from foundation.regime.unsupervised import synth_regime_world, dynamic_trade
from foundation.regime.pace_of_place import pace_features
from foundation.data.adapters.frodobots import FrodoBots2K
from foundation.data.adapters.geodnet import GeodnetNTRIP, throughput_stream
from foundation.data.adapters.helium import HeliumAPI, transfer_stream


def _trailing_mean(x, window):
    """Causal trailing mean of x over a backward `window` (mean of x[max(0,i-window+1):i+1] at i).
    This is the deseasonalizer: subtracting it leaves the ANOMALY above the local norm — the only honest
    signal, since a shared seasonal cycle (time-of-day, subscriber rhythm) is a confound, not an edge."""
    x = np.asarray(x, float)
    c = np.concatenate(([0.0], np.cumsum(x)))
    out = np.empty(len(x))
    for i in range(len(x)):
        lo = max(0, i - window + 1)
        out[i] = (c[i + 1] - c[lo]) / (i + 1 - lo)
    return out


def _standardize(x):
    """Zero-mean, unit-std (z-score). 1e-12 floor guards a degenerate (flat) stream."""
    x = np.asarray(x, float)
    return (x - x.mean()) / (x.std() + 1e-12)


def _regime(seed):
    """FINDER 1 — unsupervised regime discovery as an edge. k-means discovers regimes on the PAST only,
    the walk-forward trader earns each regime's learned next-return (causal by construction); the P&L is
    the realized position clipped to ±1 times the next return. The planted edge lives in the hidden
    persistent regime of synth_regime_world — a genuine lag, not a seasonal cycle."""
    feat, fwd, _ = synth_regime_world(n=1500, seed=seed)
    pos, rets, _ = dynamic_trade(feat, fwd, seed=seed)
    return np.clip(pos, -1, 1) * rets


def _pace(seed):
    """FINDER 2 — the embodied pace-of-place edge. A sidewalk robot's walking pace, deseasonalized into a
    standardized anomaly `w` (pace above its trailing norm), leads a PLANTED local market that responds to
    YESTERDAY'S pace: mkt = 0.002·w[t-1] + noise. Trading the anomaly against that lagged market
    (pnl = w·mkt, dropping the warmup of the roll) earns the small planted lead-lag. Offline fixture —
    a live local-economic / token feed drops into the same slot unchanged."""
    frames = FrodoBots2K.demo_fixture(seed=seed, hours=120)     # long history -> court has the power to validate
    _, pace, _, _ = pace_features(frames)
    w = _standardize(pace - _trailing_mean(pace, window=48))    # deseasonalized pace anomaly
    rng = np.random.default_rng(seed + 100)                     # distinct offset: noise uncorrelated across sources
    mkt = 0.002 * np.roll(w, 1) + rng.normal(0, 0.01, len(w))   # market responds to LAGGED pace (the lead)
    return (w * mkt)[2:]                                        # drop the wrapped-roll warmup


def _geodnet(seed):
    """FINDER 3 — the DePIN-throughput edge. GEODNET station THROUGHPUT (RTCM epochs per window),
    standardized to a z-score, leads a PLANTED token market that responds to last window's throughput:
    mkt = 0.002·z[t-1] + noise. Trading z against that lagged market (pnl = z·mkt) earns the small
    planted lead-lag. Offline fixture — a live NTRIP caster drops into the same slot unchanged."""
    epochs = GeodnetNTRIP.demo_fixture(hours=72, seed=seed)     # long history -> court has the power to validate
    _, thr = throughput_stream(epochs)
    z = _standardize(thr)                                       # physical signal: station throughput
    rng = np.random.default_rng(seed + 200)                     # distinct offset: noise uncorrelated across sources
    mkt = 0.002 * np.roll(z, 1) + rng.normal(0, 0.01, len(z))   # market responds to LAGGED throughput
    return (z * mkt)[1:]                                        # drop the wrapped-roll warmup


def _helium(seed):
    """FINDER 4 — the LoRaWAN SISTER of geodnet. Helium network DATA TRANSFER (Data Credits burned per
    window), standardized, leads a PLANTED HNT market that responds to last window's transfer: same
    causal shape (usage -> burn -> token) and the same data-plane FAMILY as geodnet, so a SINGLE adapter
    shape plugs into both. On REAL data this is the test for LoRaWAN-SECTOR beta: if the geodnet and
    helium edges co-move, the orthogonality filter collapses them to one bet (no double-counted breadth).
    Offline fixture — a live Helium network-stats endpoint drops into the same slot unchanged."""
    records = HeliumAPI.demo_fixture(hours=72, seed=seed)
    _, transfer = transfer_stream(records)
    z = _standardize(transfer)
    rng = np.random.default_rng(seed + 300)                     # distinct offset: noise uncorrelated across sources
    mkt = 0.002 * np.roll(z, 1) + rng.normal(0, 0.01, len(z))   # HNT responds to LAGGED data-transfer
    return (z * mkt)[1:]


# The finder registry: a live feed / P2P contributor registers new sources here; the rest of the
# portfolio machinery (court -> orthogonality -> allocator) consumes the candidates unchanged.
SOURCES = {"regime": _regime, "pace": _pace, "geodnet": _geodnet, "helium": _helium}


def candidates(seeds_per_source=4):
    """Run every finder over `seeds_per_source` seeds (1-indexed; sources outer, seeds inner) and return
    the candidate list: [{"id": "<source>-<seed>", "source": <source>, "pnl": 1D np.ndarray}, ...]. Each
    `pnl` is a per-bar P&L stream ready for the court (Deflated Sharpe) and the orthogonality filter.
    Distinct finders + distinct rng offsets => genuinely cross-source-orthogonal candidates, the whole
    point: breadth the book can actually earn from, not ten echoes of one generator."""
    out = []
    for source, fn in SOURCES.items():
        for seed in range(1, int(seeds_per_source) + 1):
            out.append({"id": "%s-%d" % (source, seed), "source": source,
                        "pnl": np.asarray(fn(seed), float)})
    return out
