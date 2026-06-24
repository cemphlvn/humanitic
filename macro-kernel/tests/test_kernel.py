"""Kernel floor: VSA laws, the weight-vector contract, the StrategyObject pipeline."""
import numpy as np
from foundation.kernel import vsa
from foundation.kernel.contracts import validate_weights
from foundation.operator import baselines


def run():
    laws = vsa.selftest()
    assert laws["orthogonality |a.b|"] < 0.05, laws
    assert laws["bind->unbind recovers"] > 0.99, laws
    assert laws["bundle keeps a"] > 0.40, laws

    validate_weights(0.9, max_gross=1.0)                 # ok
    try:
        validate_weights(1.5, max_gross=1.0)
        raise AssertionError("contract must reject over-leverage")
    except ValueError:
        pass

    mom = baselines.momentum(k=10)
    w = mom.target_weight(np.linspace(100, 110, 50), 30)  # ordered pipeline runs
    assert -1.0 <= w <= 1.0
    print("test_kernel: OK")
    return True


if __name__ == "__main__":
    run()
