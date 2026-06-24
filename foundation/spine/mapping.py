"""
The cognition <-> finance <-> physics map. The three domains share dimensional layers, so the
spine's conservation math is the SAME law in each. Plus the finance reading: mining IS grounding;
the strategy is a channel streaming input->output bits; its sink distribution is bounded by the spine.
"""
from foundation.spine import conservation as C

# one row = one dimensional layer, named in each of the three domains.
LAYERS = [
    ("substrate",        "RLC phasors / wave field",      "FHRR torus kernel",   "regime hypervectors"),
    ("state",            "Hamiltonian phase space",       "held bits in store",  "market regime |M_t>"),
    ("chaos sink (lam)", "Lyapunov / KS-entropy (Pesin)", "memory decay",        "edge / alpha decay rate"),
    ("source",           "energy injection / drive",      "grounding rho.I_g",   "mining (.local trigrams)"),
    ("coupling",         "injection locking (PLL)",       "rho*.I_g ~= lambda",  "grounding to hold edge"),
    ("capacity",         "modes / bandwidth",             "C(D) = 0.386.D",      "bits of edge per regime dim"),
    ("phase transition", "KAM  K_g = 0.9716",             "auditability wall",   "regime shift / unpredictable"),
    ("channel bound",    "Shannon capacity",              "converse  H_oracle",  "strategy I/O bit-rate cap"),
]


def mining_unlocks_trading(mining_rate, lam):
    """The law behind '.local mining unlocks trading': to HOLD edge against market churn `lam` you
    must mine (ground) at >= rho* = lam / I_g. Below it, held edge decays to zero — nothing to trade.
    It is not a policy; it is the source<->sink coupling. Returns (unlocked, required, surplus)."""
    required = C.required_grounding_rate(lam)
    return (mining_rate >= required, required, mining_rate - required)


def sink_distribution(K, rho, p_f, D):
    """The FHDD sink distribution: the held-information budget AT the information sink — the cap on the
    output (decision) bit-rate a running strategy can stream. `held_bits` = how much edge survives the
    sink given grounding rho and churn p_f; `utilization` = held / capacity."""
    held = C.held_information(K, rho, p_f, D)
    cap = C.capacity(D)
    return {"held_bits": held, "capacity_bits": cap, "utilization": held / cap}
