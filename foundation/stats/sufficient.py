"""
sufficient — store the SUFFICIENT STATISTICS of tuples analyzed over selected open datasets:
covariances, Beta's, and Dirichlets. These are CONJUGATE Bayesian sufficient statistics — small,
portable, updatable ONLINE (one pass over a stream), summarizing a tuple's behavior WITHOUT keeping
raw data:

  • OnlineCovariance   — Welford's stable streaming mean + covariance of a tuple's feature vector.
  • BetaPosterior      — Beta(a,b), conjugate to Bernoulli: a binary outcome of the tuple (e.g. the
                         correspondence held / the regime persisted), with a credible interval.
  • DirichletPosterior — Dir(alpha), conjugate to Categorical: the tuple's distribution over the NEXT
                         regime, with predictive probabilities, concentration, and entropy in bits.

Only the PARAMETERS leave (sufficient — the raw tuples never do); the runtime persists them to .local
(private IP). Article 0 by construction: aggregate statistics, not raw streams.
"""
import math
import numpy as np


class OnlineCovariance:
    """Welford's online mean + covariance (numerically stable, one pass, stores no samples)."""
    def __init__(self, dim):
        self.n = 0
        self.mean = np.zeros(dim)
        self._M2 = np.zeros((dim, dim))

    def update(self, x):
        x = np.asarray(x, float)
        self.n += 1
        d = x - self.mean
        self.mean += d / self.n
        self._M2 += np.outer(d, x - self.mean)        # outer(old delta, new delta) — the stable form
        return self

    def covariance(self):
        return self._M2 / (self.n - 1) if self.n > 1 else np.zeros_like(self._M2)

    def params(self):
        return {"n": self.n, "mean": self.mean.tolist(), "cov": self.covariance().tolist()}


class BetaPosterior:
    """Beta(a, b), conjugate to Bernoulli. update(success: bool). mean / variance / credible interval."""
    def __init__(self, a=1.0, b=1.0):                  # uniform prior
        self.a, self.b = float(a), float(b)

    def update(self, success):
        if success:
            self.a += 1.0
        else:
            self.b += 1.0
        return self

    def mean(self):
        return self.a / (self.a + self.b)

    def variance(self):
        s = self.a + self.b
        return (self.a * self.b) / (s * s * (s + 1.0))

    def interval(self, z=1.96):
        m, sd = self.mean(), math.sqrt(self.variance())
        return (max(0.0, m - z * sd), min(1.0, m + z * sd))

    def params(self):
        return {"a": self.a, "b": self.b, "mean": self.mean()}


class DirichletPosterior:
    """Dir(alpha) over K categories, conjugate to Categorical. update(k). predictive/concentration/entropy."""
    def __init__(self, K, alpha0=1.0):                 # symmetric prior
        self.alpha = np.full(K, float(alpha0))

    def update(self, k):
        self.alpha[int(k)] += 1.0
        return self

    def predictive(self):                              # posterior mean = expected category probabilities
        return self.alpha / self.alpha.sum()

    def concentration(self):
        return float(self.alpha.sum())

    def entropy_bits(self):                            # entropy of the predictive distribution, in bits
        p = self.predictive()
        return float(-np.sum(p * np.log2(np.clip(p, 1e-12, 1.0))))

    def map_category(self):
        return int(np.argmax(self.alpha))

    def params(self):
        return {"alpha": self.alpha.tolist(), "predictive": self.predictive().tolist()}


class TupleStats:
    """Per-tuple sufficient statistics: a covariance, a Beta, and a Dirichlet, updated from a stream."""
    def __init__(self, dim, K):
        self.cov = OnlineCovariance(dim)
        self.beta = BetaPosterior()
        self.dirichlet = DirichletPosterior(K)

    def observe(self, feature, success, next_category):
        self.cov.update(feature)
        self.beta.update(success)
        self.dirichlet.update(next_category)
        return self

    def params(self):
        return {"cov": self.cov.params(), "beta": self.beta.params(), "dirichlet": self.dirichlet.params()}


class TupleStatsStore:
    """Keyed store — one TupleStats per tuple/atom analyzed over the open datasets. Serializes ONLY
    parameters (sufficient); the runtime persists these to .local (private). This module never targets
    .local itself — the caller passes the path."""
    def __init__(self, dim, K):
        self.dim, self.K = dim, K
        self.by_key = {}

    def observe(self, key, feature, success, next_category):
        ts = self.by_key.get(key)
        if ts is None:
            ts = self.by_key[key] = TupleStats(self.dim, self.K)
        ts.observe(feature, success, next_category)
        return ts

    def params(self):
        return {k: ts.params() for k, ts in self.by_key.items()}

    def save(self, path):
        import os
        import json
        with open(path, "w") as f:
            json.dump(self.params(), f)
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass
        return path
