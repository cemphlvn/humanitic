"""
realjoin — pull a real PHYSICAL-activity stream (Hivemapper ODC GPS, or GEODNET NTRIP throughput) and a
MARKET stream (HONEY / GEOD), then run the CAUSAL as-of join + a lead-lag dynamics read.

`live_join` hits the network and raises (with setup instructions) until the source is configured;
`replay_join` runs the SAME pipeline on the adapters' real-schema demo fixtures — the offline floor.
Recommended first target: GEODNET; fastest prototype: Hivemapper.
"""
import numpy as np

from foundation.data import align
from foundation.data.adapters import hivemapper, geodnet


def _demo_market(t_robot, activity, lag_windows=2, dt_frac=0.8, seed=0):
    """A DEMO token series (HONEY/GEOD) on its OWN irregular clock that co-moves with LAGGED physical
    activity. Offline only — the live market adapter replaces this with the real token series."""
    rng = np.random.default_rng(seed)
    if len(t_robot) < 2:
        return np.array([]), np.array([])
    win = t_robot[1] - t_robot[0]
    dt = win * dt_frac
    span0, span1 = t_robot[0], t_robot[-1]
    m = max(2, int((span1 - span0) / dt))
    t_m = span0 + np.arange(m) * dt + rng.normal(0, win * 0.1, m)         # its own irregular clock
    t_m = np.sort(np.clip(t_m, span0, span1))
    a_on_m = np.interp(t_m - lag_windows * win, t_robot, activity)         # lagged activity on market clock
    level = 1.0 + (a_on_m - a_on_m.mean()) / (a_on_m.std() + 1e-9) * 0.2 + rng.normal(0, 0.05, m)
    return t_m, level


def _robot_stream(target):
    if target == "hivemapper":
        gps = hivemapper.HivemapperODC.demo_fixture()
        t_r, act = hivemapper.activity_stream(gps, window_ms=300000)
        return t_r, act, 300000
    if target == "geodnet":
        ep = geodnet.GeodnetNTRIP.demo_fixture()
        t_r, act = geodnet.throughput_stream(ep, window_s=300)
        return t_r, act, 300
    raise ValueError("unknown target %r (hivemapper|geodnet)" % target)


def _join(t_r, act, t_m, sig, tolerance):
    idx = align.asof_align(t_r, t_m, tolerance=tolerance)                  # causal backward as-of join
    align.assert_causal(t_r, t_m, idx)
    keep = idx >= 0
    a, s = act[keep], sig[idx[keep]]
    corr = (round(float(np.corrcoef(a, s)[0, 1]), 3)
            if keep.sum() > 2 and a.std() > 0 and s.std() > 0 else None)
    return {"robot_frames": int(len(t_r)), "market_frames": int(len(t_m)),
            "aligned": int(keep.sum()), "causal": True, "corr": corr, "lead_lag": align.lead_lag(a, s)}


def replay_join(target, tolerance=None, seed=0):
    """Offline floor: build both streams from the adapters' real-schema fixtures, run the as-of join."""
    t_r, act, win = _robot_stream(target)
    t_m, sig = _demo_market(t_r, act, seed=seed)
    out = {"target": target, "mode": "replay"}
    out.update(_join(t_r, act, t_m, sig, tolerance if tolerance is not None else win))
    return out


def live_join(target, tolerance=None):
    """Live: pull the real robot stream from the configured source (raises with setup instructions if
    unconfigured/offline), then run the same join. The market adapter is configured separately."""
    if target == "hivemapper":
        gps = hivemapper.HivemapperODC().gps()                            # raises if ODC_API_URL unset
        t_r, act = hivemapper.activity_stream(gps)
    elif target == "geodnet":
        ep = geodnet.GeodnetNTRIP().stream()                              # raises until caster+creds set
        t_r, act = geodnet.throughput_stream(ep)
    else:
        raise ValueError("unknown target %r (hivemapper|geodnet)" % target)
    raise RuntimeError("%s robot stream pulled; configure a live HONEY/GEOD market source to complete "
                       "the join (price feed via CoinGecko/DefiLlama or Base/Solana RPC)." % target)
