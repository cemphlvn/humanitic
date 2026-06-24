"""
Property / adversarial tests for the conservation SPINE — refutation ethos: we try to BREAK it.

Where the existing test_spine.py asserts a handful of point facts, this file hammers the spine
with random sweeps and boundary probes. The crown jewel is the Shannon converse: over hundreds of
random error-rate vectors the naive (Jensen-blind) decoder bound must NEVER exceed the oracle.
"""
import numpy as np
from foundation.spine import conservation as C
from foundation.spine import mapping as M


def run():
    rng = np.random.default_rng(20260624)

    # -- binary_entropy: symmetric, peaks at 0.5, ~0 at the rails ------------------------------
    for e in rng.uniform(0.0, 1.0, size=200):
        assert abs(C.binary_entropy(e) - C.binary_entropy(1.0 - e)) < 1e-9, f"H2 not symmetric at {e}"
    assert abs(C.binary_entropy(0.5) - 1.0) < 1e-12                 # maximum is exactly 1 bit
    assert C.binary_entropy(0.0) < 1e-6 and C.binary_entropy(1.0) < 1e-6
    # no random draw can beat the e=0.5 maximum
    assert C.binary_entropy(0.5) >= np.max([C.binary_entropy(e) for e in rng.uniform(0, 1, 100)]) - 1e-12

    # -- capacity is exactly linear, anchored at 0 ---------------------------------------------
    assert C.capacity(0) == 0.0
    for D in rng.integers(1, 100000, size=50):
        D = int(D)
        assert abs(C.capacity(2 * D) - 2 * C.capacity(D)) < 1e-6
        assert abs(C.capacity(D) - C.C_PER_DIM * D) < 1e-9

    # -- held_information: monotone up in rho, down in p_f; ALWAYS <= capacity(D) ---------------
    K, D = 200.0, 1024
    rhos = np.sort(rng.uniform(5, 180, size=12))
    p_fs = np.sort(rng.uniform(0.005, 0.1, size=12))
    # monotone increasing in grounding rho (more refresh -> younger -> more held)
    held_by_rho = [C.held_information(K, r, 0.01, D) for r in rhos]
    for a, b in zip(held_by_rho, held_by_rho[1:]):
        assert b >= a - 1e-9, f"held not monotone-up in rho: {a} -> {b}"
    # monotone decreasing in churn p_f (more decay -> more staleness -> less held)
    held_by_pf = [C.held_information(K, 120.0, pf, D) for pf in p_fs]
    for a, b in zip(held_by_pf, held_by_pf[1:]):
        assert b <= a + 1e-9, f"held not monotone-down in p_f: {a} -> {b}"
    # the bit reservoir ALWAYS binds, over a random sweep
    for _ in range(300):
        Kx = rng.uniform(10, 5000)
        rx = rng.uniform(1, Kx)
        pfx = rng.uniform(0.0, 0.2)
        Dx = int(rng.integers(2, 4096))
        assert C.held_information(Kx, rx, pfx, Dx) <= C.capacity(Dx) + 1e-9
    # renewal value would blow past a tiny reservoir with zero churn -> capped exactly at capacity
    capped = C.held_information(K=10000, rho=10000, p_f=0.0, D=8)
    assert abs(capped - C.capacity(8)) < 1e-6

    # -- required_grounding_rate: linear in lam, zero at zero ----------------------------------
    assert C.required_grounding_rate(0.0) == 0.0
    for lam in rng.uniform(0.0, 5.0, size=50):
        assert abs(C.required_grounding_rate(lam) - lam / C.I_G_NATS) < 1e-12
    assert abs(C.required_grounding_rate(2.0) - 2 * C.required_grounding_rate(1.0)) < 1e-12

    # == THE SHANNON CONVERSE (the key one) ====================================================
    # Jensen: 1 - H2(E[e]) <= 1 - E[H2(e)]  because H2 is concave. naive <= oracle, ALWAYS.
    for _ in range(200):
        m = int(rng.integers(1, 64))
        e_tau = rng.uniform(0.0, 0.5, size=m)              # error rates in (0, 0.5)
        assert C.naive_decoder_bound(e_tau) <= C.shannon_converse(e_tau) + 1e-9, (
            "Jensen / decoder gap violated", e_tau)
    # equality only when the spread collapses (all e equal) — sanity on the gap direction
    flat = np.full(10, 0.3)
    assert abs(C.naive_decoder_bound(flat) - C.shannon_converse(flat)) < 1e-9

    # -- predictable(): just below KAM is predictable, just above is chaos ----------------------
    th = C.KAM_THRESHOLD
    assert C.predictable(th - 1e-6) is True
    assert C.predictable(th + 1e-6) is False
    assert C.predictable(th) is False                       # threshold itself is NOT below it
    assert C.predictable(0.0) and not C.predictable(10.0)

    # -- directional_edge: perfect / random / anti-correlated ----------------------------------
    # perfect calls -> accuracy 1, held ~ n bits
    n = 500
    perfect = rng.choice([-1.0, 1.0], size=n)
    de = C.directional_edge(perfect, perfect, D=4096)
    assert de["n"] == n and abs(de["accuracy"] - 1.0) < 1e-12
    assert de["held_bits"] > n - 0.01                       # ~n bits held

    # independent random calls (large n) -> held tiny, excess near zero
    big = 20000
    pred = rng.choice([-1.0, 1.0], size=big)
    act = rng.choice([-1.0, 1.0], size=big)                 # independent of pred
    der = C.directional_edge(pred, act, D=4096)
    assert der["held_bits"] < 0.1 * der["n"], f"random calls held too much: {der['held_bits']}"
    assert abs(der["excess_bits"]) < 0.05 * der["n"], f"random excess not ~0: {der['excess_bits']}"

    # a DELIBERATELY anti-correlated predictor -> excess_bits < 0.
    # The market DRIFTS up (~85%), so the constant-drift NULL holds a lot of bits for free. A caller
    # that fights the drift (predicts down) lands near a coin in raw accuracy -> held ~ 0, which is
    # LESS than the null. held - null < 0: the caller is worse than just riding the drift.
    n2 = 6000
    act2 = np.where(rng.uniform(size=n2) < 0.85, 1.0, -1.0)  # strong up-drift -> juicy null freebie
    pred2 = -np.ones(n2)                                     # ALWAYS bets against the drift
    flip = rng.uniform(size=n2) < 0.40                       # noised so raw accuracy sits near a coin
    pred2[flip] = 1.0
    da = C.directional_edge(pred2, act2, D=4096)
    assert da["null_bits"] > da["held_bits"]                 # the drift freebie beats the caller
    assert da["excess_bits"] < 0.0, f"anti-correlated excess should be negative: {da['excess_bits']}"

    # empty / all-zero-sign input is handled, not crashed
    z = C.directional_edge(np.zeros(10), np.zeros(10), D=4096)
    assert z["n"] == 0 and z["held_bits"] == 0.0

    # -- mining_unlocks_trading: the law fires exactly at rate >= lam / I_g ---------------------
    lam = 0.9
    req = lam / C.I_G_NATS
    on, r_on, surplus = M.mining_unlocks_trading(req + 1e-6, lam)
    assert on is True and abs(r_on - req) < 1e-12 and surplus > 0
    off, _, deficit = M.mining_unlocks_trading(req - 1e-6, lam)
    assert off is False and deficit < 0
    at, _, exact = M.mining_unlocks_trading(req, lam)
    assert at is True and abs(exact) < 1e-12                 # boundary is inclusive (>=)

    # -- sink_distribution: utilization in [0,1]; held <= capacity over a random sweep ----------
    for _ in range(200):
        Kx = rng.uniform(10, 3000)
        rx = rng.uniform(1, Kx)
        pfx = rng.uniform(0.0, 0.15)
        Dx = int(rng.integers(2, 4096))
        sd = M.sink_distribution(Kx, rx, pfx, Dx)
        assert 0.0 <= sd["utilization"] <= 1.0 + 1e-9, sd
        assert sd["held_bits"] <= sd["capacity_bits"] + 1e-9, sd

    print("test_spine_props: OK")
    return True


if __name__ == "__main__":
    run()
