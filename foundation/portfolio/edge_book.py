"""
edge_book — the persistent BOOK of live edges (the portfolio). Each edge carries its return stream and
the honesty-validated skill (Deflated Sharpe) the architecture ranks it by. Breadth is real ONLY if the
edges are uncorrelated, so the book exposes the edge-by-edge correlation matrix. It is CAPACITY-BOUNDED:
the bundle-capacity wall C(D)=0.386·D bits caps how many orthogonal edges the kernel can hold, so a full
book admits a new edge only by displacing the weakest (see orthogonality.py). Persists to .local/edges/
(private, owner-directed).

This module is pure storage + correlation — no scoring, no allocation (those are leaf modules that consume
this contract): Edge(id, source, returns, dsr, meta) and the EdgeBook API below are the frozen interface.
"""
import os
import json
from collections import namedtuple

import numpy as np

# id: str · source: str (data origin / novelty tag) · returns: 1D array of per-bar P&L ·
# dsr: float Deflated Sharpe in [0,1] (honesty-validated skill) · meta: dict (free-form)
Edge = namedtuple("Edge", "id source returns dsr meta")


def make_edge(id, source, returns, dsr, meta=None):
    return Edge(id, source, np.asarray(returns, float), float(dsr), dict(meta or {}))


class EdgeBook:
    def __init__(self, capacity=16):
        self.capacity = int(capacity)                          # max orthogonal edges the kernel can hold
        self.edges = []                                        # list[Edge]

    def __len__(self):
        return len(self.edges)

    def ids(self):
        return [e.id for e in self.edges]

    def get(self, eid):
        for e in self.edges:
            if e.id == eid:
                return e
        return None

    def add(self, edge):
        self.edges.append(edge)
        return self

    def remove(self, eid):
        self.edges = [e for e in self.edges if e.id != eid]
        return self

    def returns_matrix(self):
        """(n_edges, T) aligned return streams, truncated to the shortest (most recent T bars)."""
        if not self.edges:
            return np.zeros((0, 0))
        T = min(len(e.returns) for e in self.edges)
        return np.array([np.asarray(e.returns, float)[-T:] for e in self.edges])

    def correlation(self):
        """Edge-by-edge Pearson correlation matrix (identity-ish when the book is genuinely diverse)."""
        M = self.returns_matrix()
        if M.shape[0] < 2 or M.shape[1] < 2:
            return np.eye(M.shape[0])
        C = np.corrcoef(M)
        return np.nan_to_num(C, nan=0.0)

    def to_dict(self):
        return {"capacity": self.capacity,
                "edges": [{"id": e.id, "source": e.source, "returns": [float(x) for x in e.returns],
                           "dsr": e.dsr, "meta": e.meta} for e in self.edges]}

    @classmethod
    def from_dict(cls, d):
        b = cls(capacity=d.get("capacity", 16))
        for e in d.get("edges", []):
            b.add(make_edge(e["id"], e["source"], e["returns"], e["dsr"], e.get("meta", {})))
        return b

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            json.dump(self.to_dict(), f)
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
        return path

    @classmethod
    def load(cls, path):
        with open(path) as f:
            return cls.from_dict(json.load(f))
