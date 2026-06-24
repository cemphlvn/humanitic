"""TTN sector control: a PURE-SECTOR edge is KILLED by residualizing against the sector factor, while a
network-SPECIFIC edge SURVIVES it. The Frisch-Waugh control that separates real edge from LoRaWAN beta."""
import numpy as np

from foundation.eval import verdict


def _ar1(n, phi, rng):
    x = np.empty(n)
    x[0] = rng.normal()
    for i in range(1, n):
        x[i] = phi * x[i - 1] + rng.normal()
    return x


def run():
    rng = np.random.default_rng(0)
    n = 900
    sector = _ar1(n, 0.7, rng)                                  # the TTN LoRaWAN-sector factor (persistent)

    # network-SPECIFIC edge: signal independent of the sector; the return is LED by the signal
    z = _ar1(n, 0.6, rng)
    fwd = np.empty(n)
    fwd[0] = rng.normal(0, 0.05)
    fwd[1:] = 0.015 * z[:-1] + rng.normal(0, 0.05, n - 1)
    assert verdict.measure(z, fwd)["verdict"] == "MEANINGFUL"                       # real edge present
    assert verdict.measure(z, fwd, control=sector)["verdict"] == "MEANINGFUL"       # SURVIVES the control

    # PURE-SECTOR edge: the signal IS the sector; the return is LED by the SECTOR (no network-specific link)
    zb = sector + rng.normal(0, 0.2, n)
    fwdb = np.empty(n)
    fwdb[0] = rng.normal(0, 0.05)
    fwdb[1:] = 0.015 * sector[:-1] + rng.normal(0, 0.05, n - 1)
    assert verdict.measure(zb, fwdb)["verdict"] == "MEANINGFUL"                      # LOOKS like an edge
    assert verdict.measure(zb, fwdb, control=sector)["verdict"] == "NOT MEANINGFUL"  # KILLED -> it was sector beta

    print("test_sector_control: OK (network-specific edge survives the TTN control; pure-sector beta killed by it)")
    return True


if __name__ == "__main__":
    run()
