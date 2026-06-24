"""
contribute — a demo P2P edge-market ROUND. The discovery finders' candidates are submitted as
contributions (return stream + a lineage manifest — never the raw strategy, Article 0), judged by the
court (network-wide n_trials) + the orthogonality filter, and paid DSR × novelty, split HUMANITIK 95/5.
Synthetic candidates (flagged); a real P2P network submits real edges and settlement runs through the
agent economy (x402 / CDP, testnet-gated) — not done here.
"""
from foundation.portfolio import discovery
from foundation.portfolio.edge_book import EdgeBook
from foundation.commons import contributor
from foundation.ingest import lineage


def run(seeds_per_source=3, capacity=6):
    cands = discovery.candidates(seeds_per_source=seeds_per_source)
    subs = [(c["source"], c["id"], c["pnl"],
             lineage.manifest(c["id"], {"source": c["source"]}, {}, "demo", 0)) for c in cands]
    res = contributor.network_round(EdgeBook(capacity=capacity), subs)
    return {"submissions": len(subs), "admitted": res["admitted"],
            "total_reward": round(res["total_reward"], 6),
            "foundation_take": round(res["foundation_take"], 6), "book_size": res["book_size"],
            "verdicts": [{k: v.get(k) for k in ("contributor", "edge", "admitted", "dsr", "reward")}
                         for v in res["verdicts"]],
            "caveat": "synthetic discovery candidates (planted) — validates the reward protocol; a real "
                      "P2P network submits real edges; settlement via the agent economy (x402/CDP, testnet-gated)"}
