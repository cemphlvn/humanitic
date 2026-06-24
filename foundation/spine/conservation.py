"""
THE WORKING SPINE — the foundation math, copied in FORM from the lineage's gen-4 `peras`
conservation theorem (see ~/lib/table/LABNOTES.md). It is research of its own: derived on the
Chirikov standard map (physics) and the FHRR store (cognition), refutation-tested to ratio
1.00 +/- 2-4% with ZERO free parameters. Finance is the third instance of one law.

One conserved currency: information (bits). The SAME law across layers that share dimensions:
  physics    — information lost to chaos (Pesin h_KS = sum of positive Lyapunov exponents)
  cognition  — held bits in the FHRR store, refreshed against decay
  finance    — edge (alpha) held against market churn, refreshed by GROUNDING (mining)

  conservation:        d(held bits)/dt = source - sinks,  capped by capacity
  source<->sink law:   rho* . I_g  ~=  lambda          (peras b06: grounding covers the chaos leak)
  capacity:            C(D) = c . D,  c ~= 0.386 bits/dim   (peras b07: linear in dimension)
  phase transition:    predictable BELOW Greene's K_g = 0.9716, chaotic above  (peras b03, KAM)
"""
import numpy as np

C_PER_DIM = 0.386                 # peras b07: capacity is LINEAR in dimension (~0.39 bits/dim)
I_G_NATS = 1.5                    # peras b06: information per grounding event (~1.5 nats)
KAM_THRESHOLD = 0.971635406       # peras b03: Greene's last golden KAM torus (Chirikov standard map)


def binary_entropy(e):
    """H2 — the bit-cost of an error rate e. Concave; the source of the decoder (Jensen) gap."""
    e = np.clip(np.asarray(e, float), 1e-12, 1 - 1e-12)
    return -e * np.log2(e) - (1 - e) * np.log2(1 - e)


def capacity(D):
    """The dimension resource IS a bit reservoir: C(D) = c . D bits (peras b07: r=0.9997)."""
    return C_PER_DIM * D


def required_grounding_rate(lam):
    """Source<->sink coupling (peras b06, r=0.99): to HOLD a bounded estimate of a chaotic state you
    must ground at rho* ~= lambda / I_g. Below it, the estimate (the edge) is lost to chaos."""
    return lam / I_G_NATS


def e_stale(age, p_f):
    """BSC staleness: probability a held bit is wrong `age` steps after its last refresh."""
    return 0.5 * (1.0 - (1.0 - 2.0 * p_f) ** np.asarray(age, float))


def held_information(K, rho, p_f, D, max_age=4000):
    """
    The conservation law (the AoI/renewal core of peras-1), capped by capacity.

      held = K . (1 - E_age[H2(e_stale(age))]),   age ~ Geometric(r),  r = rho / K
      then capped at C(D).

    More grounding (rho up) -> younger ages -> less staleness -> more held edge.
    More churn (p_f up) -> more staleness -> less held edge.  Always capped by the bit reservoir C(D).
    """
    r = min(max(rho / K, 1e-9), 1.0)
    ages = np.arange(max_age)
    P = r * (1 - r) ** ages
    P = P / P.sum()                                   # geometric age distribution (renormalize tail)
    mean_H2 = float(np.sum(P * binary_entropy(e_stale(ages, p_f))))
    held = K * (1.0 - mean_H2)
    return float(min(held, capacity(D)))


def shannon_converse(e_tau):
    """Oracle (Shannon) per-item rate over the age distribution: 1 - E_tau[H2(e_tau)]  (peras b19)."""
    return 1.0 - float(np.mean(binary_entropy(e_tau)))


def naive_decoder_bound(e_tau):
    """FHRR naive nearest-codeword bound: 1 - H2(E_tau[e_tau]). <= oracle by Jensen (the decoder gap
    the tau-aware decoder closes, peras b20)."""
    return 1.0 - float(binary_entropy(np.mean(e_tau)))


def predictable(coupling):
    """KAM (peras b03): long-horizon prediction is possible only BELOW Greene's K_g (integrable
    torus). Above it lambda>0 and the horizon collapses — a regime shift into un-auditability."""
    return coupling < KAM_THRESHOLD
