"""The foundation-math spine: the conservation law, source<->sink coupling, Shannon converse, KAM,
and the finance laws (mining-unlocks-trading, the FHDD sink distribution)."""
import numpy as np
from foundation.spine import conservation as C
from foundation.spine import mapping as M


def run():
    # H2 endpoints
    assert abs(C.binary_entropy(0.5) - 1.0) < 1e-9 and C.binary_entropy(0.0) < 1e-6
    # capacity is linear in dimension
    assert abs(C.capacity(2048) - 2 * C.capacity(1024)) < 1e-6
    # source<->sink coupling: rho* ~ lambda
    assert C.required_grounding_rate(0.0) == 0.0
    assert C.required_grounding_rate(0.69) > C.required_grounding_rate(0.30)

    # conservation law monotonicities + capacity cap
    lo = C.held_information(K=200, rho=20, p_f=0.01, D=1024)
    hi = C.held_information(K=200, rho=120, p_f=0.01, D=1024)
    assert hi > lo                                            # more grounding -> more held edge
    assert C.held_information(K=200, rho=120, p_f=0.05, D=1024) < hi   # more churn -> less held edge
    capped = C.held_information(K=10000, rho=10000, p_f=0.0, D=10)
    assert abs(capped - C.capacity(10)) < 1e-6               # the bit reservoir binds

    # Shannon converse: the naive FHRR decoder is bounded by the oracle (Jensen / decoder gap)
    e = np.array([0.05, 0.2, 0.45])
    assert C.naive_decoder_bound(e) <= C.shannon_converse(e) + 1e-9

    # KAM phase transition
    assert C.predictable(0.5) and not C.predictable(4.0)

    # mining-unlocks-trading is a LAW, not a policy
    unlocked, req, surplus = M.mining_unlocks_trading(mining_rate=1.0, lam=0.69)
    assert unlocked and surplus > 0 and abs(req - 0.69 / C.I_G_NATS) < 1e-9
    starved, _, deficit = M.mining_unlocks_trading(mining_rate=0.1, lam=0.69)
    assert (not starved) and deficit < 0                     # too little mining -> no edge -> no trading

    # the FHDD sink distribution
    sd = M.sink_distribution(K=200, rho=120, p_f=0.01, D=1024)
    assert 0 <= sd["utilization"] <= 1 and sd["held_bits"] <= sd["capacity_bits"]

    # the three-domain map names every layer in all three domains
    assert all(len(row) == 4 for row in M.LAYERS)
    print("test_spine: OK")
    return True


if __name__ == "__main__":
    run()
