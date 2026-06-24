"""
contributor — the reward-carrying SUBMISSION SEAM for a P2P edge network on top of the portfolio book.

A contributor never ships the strategy. They submit an edge's RETURN STREAM plus a `lineage` dict
(provenance: where it came from, what it claims) — the raw signal-generating code, the secret sauce,
stays in their private `.local` (Article 0: unpublishable, never touched here). The network only ever
sees realized P&L and a story about it; that is enough to JUDGE the edge and PRICE it, and nothing more.

Two gates stand between a submission and a payout, both inherited from the single-owner book:

  1. The statistical court (Deflated Sharpe). Crucially the court deflates against NETWORK-WIDE
     `n_trials` — the multiple-testing count across ALL contributors this round, not just this one's
     attempts. Mine the network with a thousand lucky coin-flips and one will post a gorgeous Sharpe;
     if we deflate against n_trials=1 we crown that luck at scale. The haircut is what makes a P2P
     edge market honest: more submitters competing => a higher bar to clear.

  2. The orthogonality filter (capacity-bounded). The book is breadth, and breadth is real only when
     edges are uncorrelated, so an admitted edge must add NEW direction. A near-copy of an incumbent
     scores ~0 novelty and is rejected as too-correlated; it earns nothing no matter how skillful.

Payout flows ONLY for an admitted, orthogonal edge: gross = reward_pool · score(dsr, novelty), split
HUMANITIK 95/5 — the contributor keeps 95%, the foundation takes a 5% cut to fund the commons. A copy
earns ~0 (rejected); a weak edge fails the court (reward 0). This module computes the VERDICT and the
OWED amount only — it is pure numpy, deterministic, performs NO network I/O and writes NO `.local`.
Actual settlement (x402 / CDP, testnet-gated) is the agent economy's job and is NOT done here.
"""
import numpy as np

from foundation.portfolio.edge_book import make_edge
from foundation.portfolio import orthogonality
from foundation.eval.significance import deflated_sharpe

# HUMANITIK split: the contributor keeps the rest; the foundation takes this slice to fund the commons.
FOUNDATION_CUT = 0.05


def submit(book, contributor_id, edge_id, returns, lineage, network_trials,
           tau=0.5, reward_pool=1.0, sr_variance=0.01):
    """Judge and price ONE submission against the live book. `returns` is the edge's realized P&L
    stream; `lineage` is the provenance dict (the only thing shipped besides the stream). The Sharpe
    is the deflated against NETWORK-WIDE `network_trials` (multiple testing across all contributors).

    A submission must clear the court (dsr >= 0.95) AND be orthogonal enough to be admitted to the
    capacity-bounded book; only then is it owed a reward. Returns a verdict dict; never mutates
    `.local`, never touches the network."""
    returns = np.asarray(returns, float)
    sharpe = float(returns.mean() / (returns.std() + 1e-12))
    dsr = deflated_sharpe(sharpe, n_trials=network_trials, n_obs=len(returns),
                          sr_variance=sr_variance)["deflated_sharpe"]

    # 1) Statistical court: not skilled after the network-wide multiple-testing haircut -> no payout.
    if dsr < 0.95:
        return {"contributor": contributor_id, "edge": edge_id, "admitted": False,
                "reason": "fail-court", "dsr": round(dsr, 4), "reward": 0.0}

    # 2) Orthogonality filter: skilled, but does it add breadth the book does not already own?
    edge = make_edge(edge_id, "contrib/" + contributor_id, returns, dsr, {"lineage": lineage})
    dec = orthogonality.admit(book, edge, tau)
    if not dec["admitted"]:
        return {"contributor": contributor_id, "edge": edge_id, "admitted": False,
                "reason": dec["reason"], "dsr": round(dsr, 4),
                "novelty": dec["novelty"], "reward": 0.0}

    # 3) Admitted and orthogonal: price it. gross = pool · skill-gated-by-breadth, split HUMANITIK 95/5.
    gross = reward_pool * orthogonality.score(dsr, dec["novelty"])
    payout = gross * (1.0 - FOUNDATION_CUT)
    return {"contributor": contributor_id, "edge": edge_id, "admitted": True,
            "action": dec["action"], "displaced": dec.get("displaced"),
            "dsr": round(dsr, 4), "novelty": dec["novelty"],
            "reward": round(payout, 6), "foundation_cut": round(gross * FOUNDATION_CUT, 6)}


def network_round(book, submissions, tau=0.5, reward_pool=1.0):
    """One competitive ROUND of the edge market. `submissions` is a list of
    (contributor_id, edge_id, returns, lineage). The network-wide trial count IS the number of
    submitters competing this round — so the court's honesty bar rises with the crowd. Each is judged
    in turn against the (mutating) book; returns the round summary plus every verdict."""
    network_trials = len(submissions)
    sharpes = [float(np.asarray(r, float).mean() / (np.asarray(r, float).std() + 1e-12))
               for (_, _, r, _) in submissions]
    sr_var = max(float(np.var(sharpes)), 1e-6)              # empirical dispersion of trial Sharpes (proper DSR)
    verdicts = [submit(book, cid, eid, returns, lineage, network_trials, tau, reward_pool, sr_variance=sr_var)
                for (cid, eid, returns, lineage) in submissions]
    return {"verdicts": verdicts,
            "admitted": sum(1 for v in verdicts if v["admitted"]),
            "total_reward": sum(v["reward"] for v in verdicts),
            "foundation_take": sum(v.get("foundation_cut", 0.0) for v in verdicts),
            "book_size": len(book)}
