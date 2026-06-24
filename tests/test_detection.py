"""Regime-shift / chaos detection: planted shift is caught; calm is predictable; a spike raises coupling."""
import numpy as np
from foundation.regime import detection


def run():
    rng = np.random.default_rng(0)

    # a planted MEAN shift (down-drift then up-drift) is detected near the change
    n = 400
    r = np.concatenate([rng.normal(-0.010, 0.005, n), rng.normal(0.010, 0.005, n)])
    prices = 100.0 * np.exp(np.cumsum(r))
    det = detection.detect_regime_shift(prices, window=40, z=3.0)
    assert any(abs(s - n) < 80 for s in det["shifts"]), det["shifts"]

    # a calm stationary series is predictable
    calm = 100.0 * np.exp(np.cumsum(rng.normal(0.0003, 0.004, 600)))
    assert detection.predictability(detection.returns(calm)) > 0.5

    # a volatility spike raises the effective coupling and crushes predictability
    spiky = np.concatenate([rng.normal(0, 0.004, 480), rng.normal(0, 0.030, 20)])
    assert detection.effective_coupling(spiky) > 1.5
    assert detection.predictability(spiky) < 0.5

    print("test_detection: OK (planted shift caught; calm predictable; spike -> high coupling)")
    return True


if __name__ == "__main__":
    run()
