"""
measure — the move to PRACTICAL measurement. Run the pre-registered verdict (`eval/verdict.measure`) on a
target's (signal, forward-return) at the pre-registered N. The signal is the DESEASONALIZED network-flow
anomaly (DC-burned/hour for Helium, throughput/hour for GEODNET); the forward return is the next-bar token
return. Replay (real-schema, planted market) now — the SAME path runs on the live token price the moment
a feed is configured, and a live NOT-MEANINGFUL is a full result.
"""
import numpy as np

from foundation.data.adapters import helium, geodnet, ttn
from foundation.eval import verdict


def _deseasonalize_z(x, w=48):
    """Causal trailing-mean removal (the anomaly above the usage rhythm) -> z-score. Keeps short-range
    persistence (adjacent-hour usage clusters) while stripping the seasonal confound."""
    x = np.asarray(x, float)
    c = np.concatenate(([0.0], np.cumsum(x)))
    out = np.empty(len(x))
    for i in range(len(x)):
        lo = max(0, i - w + 1)
        out[i] = x[i] - (c[i + 1] - c[lo]) / (i + 1 - lo)
    return (out - out.mean()) / (out.std() + 1e-12)


def _series(target, seed=0):
    """~2,600 HOURLY bars of (deseasonalized flow anomaly, forward token return). Replay fixture; a live
    network-stats feed + token price replaces it. The market is PLANTED to respond to the LAGGED anomaly
    (a real lead-lag) — flagged synthetic; this validates the apparatus, not a live edge."""
    if target == "helium":
        rec = helium.HeliumAPI.demo_fixture(hours=2600, hz=1 / 300.0, seed=seed)
        _, flow = helium.transfer_stream(rec, window_s=3600)
    elif target == "geodnet":
        rec = geodnet.GeodnetNTRIP.demo_fixture(hours=2600, hz=1 / 300.0, seed=seed)
        _, flow = geodnet.throughput_stream(rec, window_s=3600)
    else:
        raise ValueError("unknown target %r (helium|geodnet)" % target)
    sig = _deseasonalize_z(flow)
    rng = np.random.default_rng(seed + 7)
    fwd = np.empty(len(sig))
    fwd[0] = rng.normal(0, 0.05)
    fwd[1:] = 0.015 * sig[:-1] + rng.normal(0, 0.05, len(sig) - 1)    # market responds to LAST hour's anomaly
    return sig, fwd


def _sector(seed=0):
    """The LoRaWAN SECTOR factor: token-free TTN network activity, deseasonalized — the confound to control
    for. A live TTN stats endpoint replaces the fixture."""
    rec = ttn.TTNetwork.demo_fixture(hours=2600, hz=1 / 300.0, seed=seed)
    _, act = ttn.activity_stream(rec, window_s=3600)
    return _deseasonalize_z(act)


def run(target="helium", n_trials=1, control=None):
    sig, fwd = _series(target)
    ctrl = None
    if control == "ttn":
        ctrl = _sector()
        m = min(len(sig), len(fwd), len(ctrl))
        sig, fwd, ctrl = sig[:m], fwd[:m], ctrl[:m]
    res = verdict.measure(sig, fwd, n_trials=n_trials, control=ctrl)
    return {"target": target, "control": control or "none",
            "pre_registered": "PLAN.live-%s.md" % target, "n_trials": n_trials, "result": res,
            "caveat": "REPLAY (planted) market — validates the apparatus end-to-end; the live %s price feed "
                      "(creds) delivers the REAL verdict. --control ttn strips LoRaWAN-sector beta so the "
                      "verdict is edge BEYOND the sector. NOT MEANINGFUL on real data is a full result."
                      % target.upper()}
