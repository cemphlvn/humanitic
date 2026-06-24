"""
pace_of_place — the FrodoBots/BitRobot thesis, made testable.

A sidewalk robot's WALKING SPEED, motion DYNAMICS, and TIME OF DAY in an urban area are a leading
indicator of that area's LOCAL MARKET. The core asset is not the robot — it is the embodied real-world
data stream. We turn telemetry into a per-area 'pace-of-place' signal and predict the area's local-market
regime (foot-traffic-priced commerce), with the pace LEADING the market:

    walking speed + dynamics + time-of-day (per area)  ->  pace signal  ->  local-market nowcast

The edge is recognizing robot data streams BEFORE they become a priced asset class. Offline the local
market is a labeled demo co-moving with lagged pace; a live local-economic / token feed drops into the
same slot. Honest caveat: time-of-day is a shared seasonal driver — the real signal is the pace ANOMALY
above the time-of-day norm; deseasonalize before trading.
"""
import numpy as np

from foundation.data import align
from foundation.data.adapters.hivemapper import _haversine_km


def walking_speed_kmh(frames):
    """Per-frame walking speed (km/h) from consecutive GPS fixes (haversine / Δt)."""
    frames = sorted(frames, key=lambda r: r["t"])
    sp = [0.0]
    for a, b in zip(frames, frames[1:]):
        dt_h = (b["t"] - a["t"]) / 3600.0
        km = _haversine_km((a["lat"], a["lon"]), (b["lat"], b["lon"]))
        sp.append(km / dt_h if dt_h > 0 else 0.0)
    return np.array(sp)


def pace_features(frames, window_s=600):
    """Per area-window: PACE (mean speed), DYNAMICS (speed std), and TIME-OF-DAY (hour).
    Returns (t[], pace[], dynamics[], tod[]) — the embodied side of the thesis."""
    frames = sorted(frames, key=lambda r: r["t"])
    sp = walking_speed_kmh(frames)
    t0 = frames[0]["t"]
    spd, hod = {}, {}
    for r, s in zip(frames, sp):
        w = int((r["t"] - t0) // window_s)
        spd.setdefault(w, []).append(s)
        hod[w] = (r["t"] / 3600.0) % 24
    ws = sorted(spd)
    return (np.array([t0 + w * window_s for w in ws], float),
            np.array([np.mean(spd[w]) for w in ws]),
            np.array([np.std(spd[w]) for w in ws]),
            np.array([hod[w] for w in ws]))


def _demo_local_market(t_pace, pace, lag_windows=2, dt_frac=0.9, seed=0):
    """A DEMO local-market series on its OWN clock that co-moves with LAGGED pace (busier sidewalks ->
    stronger local commerce). Offline only — a live local-economic/token feed replaces this."""
    rng = np.random.default_rng(seed)
    if len(t_pace) < 2:
        return np.array([]), np.array([])
    win = t_pace[1] - t_pace[0]
    dt = win * dt_frac
    span0, span1 = t_pace[0], t_pace[-1]
    m = max(2, int((span1 - span0) / dt))
    t_m = span0 + np.arange(m) * dt + rng.normal(0, win * 0.1, m)
    t_m = np.sort(np.clip(t_m, span0, span1))
    p_on_m = np.interp(t_m - lag_windows * win, t_pace, pace)
    level = 1.0 + (p_on_m - p_on_m.mean()) / (p_on_m.std() + 1e-9) * 0.4 + rng.normal(0, 0.04, m)
    return t_m, level


def _forecast_skill(pace, mkt, lag):
    """Out-of-sample skill of pace[i-lag] -> mkt[i] vs a persistence baseline. >0 => pace beats persistence."""
    n = len(mkt)
    if n - lag < 8:
        return 0.0
    x, y = pace[:n - lag], mkt[lag:n]
    half = len(y) // 2
    if half < 4:
        return 0.0
    coef = np.linalg.lstsq(np.vstack([np.ones(half), x[:half]]).T, y[:half], rcond=None)[0]
    pred = coef[0] + coef[1] * x[half:]
    sse = float(np.sum((y[half:] - pred) ** 2))
    persist = y[half - 1:len(y) - 1]
    sse_p = float(np.sum((y[half:] - persist) ** 2))
    return round(1.0 - sse / (sse_p + 1e-12), 3)


def predict_local_market(t_pace, pace, tolerance=None, seed=0):
    """The thesis end to end: as-of align the pace signal to the area's local market (causal), measure the
    lead-lag, and the out-of-sample forecast skill of pace over persistence."""
    win = (t_pace[1] - t_pace[0]) if len(t_pace) > 1 else 1.0
    t_m, mkt = _demo_local_market(t_pace, pace, seed=seed)
    idx = align.asof_align(t_pace, t_m, tolerance=tolerance if tolerance is not None else win)
    align.assert_causal(t_pace, t_m, idx)
    keep = idx >= 0
    p, m = pace[keep], mkt[idx[keep]]
    ll = align.lead_lag(p, m)
    return {"causal": True, "aligned": int(keep.sum()), "lead_lag": ll,
            "forecast_skill": _forecast_skill(p, m, ll["lag"])}
