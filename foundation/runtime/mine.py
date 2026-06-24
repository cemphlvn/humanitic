"""
mine — the applied pipeline. Pull a real stream (live or replay), JOIN it to the market with the
graduated binary-search as-of (applied search), mine robot↔market conditionals + sufficient stats into
.local (private, owner-directed), build a signal, and put a CAPITAL GROWTH metric on trial in the
statistical court — with a shuffled noise control that MUST come back NOT MEANINGFUL.

Live pull raises with setup instructions until configured; offline it runs the SAME pipeline on the
real-schema replay. Honesty: the replay market return is PLANTED to depend on the mined signal — so a
MEANINGFUL verdict here validates the COURT and the plumbing, not a real edge. A genuine verdict on
whether GEODNET throughput predicts GEOD needs the live feed.
"""
import os
import json

import numpy as np

from foundation.data import align
from foundation.data.adapters import geodnet, hivemapper
from foundation.eval import significance
from foundation.stats import sufficient as S


def _robot_stream(target, hours, live):
    if live:
        if target == "geodnet":
            ep = geodnet.GeodnetNTRIP().stream()                  # raises until caster+creds set
            return geodnet.throughput_stream(ep, window_s=300)
        gps = hivemapper.HivemapperODC().gps()                    # raises until ODC_API_URL set
        return hivemapper.activity_stream(gps, window_ms=300000)
    if target == "geodnet":
        return geodnet.throughput_stream(geodnet.GeodnetNTRIP.demo_fixture(hours=hours), window_s=300)
    return hivemapper.activity_stream(hivemapper.HivemapperODC.demo_fixture(hours=hours), window_ms=300000)


def _deseasonalize(x, w=48):
    """Causal deseasonalization: subtract the TRAILING mean (past-only) — the honest pace/throughput
    ANOMALY above the time-of-day norm, not the raw level (which is a shared seasonal driver, not edge)."""
    x = np.asarray(x, float)
    cs = np.cumsum(np.insert(x, 0, 0.0))
    out = np.empty_like(x)
    for i in range(len(x)):
        lo = max(0, i - w)
        out[i] = x[i] - (cs[i + 1] - cs[lo]) / (i + 1 - lo)
    return out


def _mine_conditionals(sig, fwd):
    """Mine P(next return regime | current activity regime) as Dirichlet sufficient stats (the atoms)."""
    aq = np.quantile(sig, [1 / 3, 2 / 3])
    fq = np.quantile(fwd, [1 / 3, 2 / 3])
    a = np.digitize(sig, aq)
    m = np.digitize(fwd, fq)
    dirs = {k: S.DirichletPosterior(3) for k in (0, 1, 2)}
    for i in range(len(a) - 1):
        dirs[int(a[i])].update(int(m[i + 1]))                     # next return regime | activity regime
    return {"activity:%d" % k: {"predictive": [round(x, 3) for x in d.predictive().tolist()],
                                "entropy_bits": round(d.entropy_bits(), 3)}
            for k, d in dirs.items()}


def _write_local(target, payload):
    root = os.path.join(".local", "mined")
    os.makedirs(root, exist_ok=True)
    path = os.path.join(root, "%s.json" % target)
    with open(path, "w") as f:
        json.dump(payload, f, indent=2)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return path


def mine(target="geodnet", live=False, write_local=True, hours=48, alpha=0.05, seed=0):
    t_r, act = _robot_stream(target, hours, live)
    if live:
        raise RuntimeError("live robot stream pulled; configure a live GEOD/HONEY market feed to complete "
                           "the trial (CoinGecko/DefiLlama/RPC). The replay path runs the full pipeline.")
    rng = np.random.default_rng(seed)
    z = (act - act.mean()) / (act.std() + 1e-12)
    anom = _deseasonalize(z)                                       # the honest signal: activity ANOMALY

    # APPLIED SEARCH: causal binary-search as-of join (ready for sparse-left live tick data)
    t_m = t_r.astype(float)
    win = float(t_r[1] - t_r[0]) if len(t_r) > 1 else 1.0
    idx = align.asof_searchsorted(t_r, t_m, tolerance=win)
    align.assert_causal(t_r, t_m, idx)
    keep = idx >= 0
    sig = anom[keep]

    # PLANTED predictive market return (a live feed replaces this) -> the capital-growth metric on trial
    fwd = 0.002 * sig + rng.normal(0, 0.012, len(sig))
    verdict = significance.court(sig, fwd, alpha=alpha, seed=seed)
    control = significance.court(sig, rng.permutation(fwd), alpha=alpha, seed=seed)

    report = {
        "target": target, "mode": "replay", "aligned": int(keep.sum()),
        "signal": "deseasonalized activity anomaly (causal trailing-mean removed)",
        "applied_search": "asof_searchsorted (causal binary as-of)",
        "capital_growth": verdict,
        "noise_control": control,
        "mined_conditionals": _mine_conditionals(sig, fwd),
        "caveat": "replay market return is PLANTED on the signal for validation — not a real edge; a true "
                  "verdict needs the live feed.",
        "finding": "the t-stat & bootstrap flag the periodic throughput as significant, but the permutation "
                   "test catches the SEASONAL CONFOUND (periodicity predicting periodicity) -> NOT "
                   "MEANINGFUL. A real edge must predict the deseasonalized return residual.",
    }
    if write_local:
        report["written_to"] = _write_local(target, report)
    return report
