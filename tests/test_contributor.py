"""Contributor seam: a P2P edge market that pays for SKILL + BREADTH, never for the raw strategy.
A strong uncorrelated edge clears the network-wide court and is paid (95/5 split); a copy of an
admitted edge earns ~0 (rejected as too-correlated); pure noise fails the court; and the more
contributors compete (network_trials), the higher the honesty bar — the same edge's DSR is haircut."""
import numpy as np

from foundation.portfolio.edge_book import EdgeBook
from foundation.commons import contributor as C
from foundation.eval.significance import deflated_sharpe


def run():
    rng = np.random.default_rng(7)
    book = EdgeBook(capacity=4)

    # (1) STRONG uncorrelated edge clears the network-wide court and is admitted -> paid, 95/5 split.
    strong = rng.normal(0.25, 1.0, 800)                       # positive drift, real skill
    v1 = C.submit(book, "alice", "alpha", strong, {"src": "vol-carry"}, network_trials=3)
    assert v1["admitted"] is True, v1
    assert v1["reward"] > 0.0, v1
    # foundation_cut is 5/95 of the contributor reward (gross split HUMANITIK 95/5).
    assert abs(v1["foundation_cut"] - v1["reward"] * 0.05 / 0.95) < 1e-6, v1
    assert len(book) == 1

    # (2) Near-COPY of the admitted edge: skillful but adds no breadth -> rejected, earns nothing.
    copy = strong + rng.normal(0.0, 0.01, 800)
    v2 = C.submit(book, "mallory", "alpha-clone", copy, {"src": "copied"}, network_trials=3)
    assert v2["admitted"] is False, v2
    assert v2["reward"] == 0.0, v2
    assert v2["novelty"] < 0.5                                 # too correlated with the book
    assert len(book) == 1                                      # book unchanged by the copy

    # (3) Pure NOISE (~zero drift): no skill, fails the statistical court before novelty even matters.
    noise = rng.normal(0.0, 1.0, 800)
    v3 = C.submit(book, "carol", "noise", noise, {"src": "rng"}, network_trials=3)
    assert v3["admitted"] is False, v3
    assert v3["reason"] == "fail-court", v3
    assert v3["reward"] == 0.0, v3

    # (4) A full network_round over several submissions pays out and admits at least one edge.
    book2 = EdgeBook(capacity=4)
    subs = [
        ("dave", "edge-d", rng.normal(0.30, 1.0, 800), {"src": "trend"}),
        ("erin", "edge-e", rng.normal(0.0, 1.0, 800), {"src": "noise"}),     # fails court
        ("frank", "edge-f", rng.normal(0.28, 1.0, 800), {"src": "meanrev"}),
    ]
    summary = C.network_round(book2, subs)
    assert summary["total_reward"] > 0.0, summary
    assert summary["admitted"] >= 1, summary
    assert summary["foundation_take"] > 0.0, summary
    assert len(summary["verdicts"]) == 3

    # (5) Network-wide multiple-testing HAIRCUT: more competitors => a strictly lower DSR for the SAME
    #     edge. n_trials=1 is the no-deflation baseline; n_trials=1000 deflates against the expected
    #     max Sharpe of a thousand lucky draws.
    sr = float(strong.mean() / (strong.std() + 1e-12))
    dsr_alone = deflated_sharpe(sr, n_trials=1, n_obs=800, sr_variance=0.01)["deflated_sharpe"]
    dsr_crowd = deflated_sharpe(sr, n_trials=1000, n_obs=800, sr_variance=0.01)["deflated_sharpe"]
    assert dsr_crowd < dsr_alone, (dsr_crowd, dsr_alone)

    print("test_contributor: OK (strong edge paid 95/5; copy rejected ~0; noise fails court; "
          "round pays out; network-wide n_trials haircut lowers DSR)")
    return True


if __name__ == "__main__":
    run()
