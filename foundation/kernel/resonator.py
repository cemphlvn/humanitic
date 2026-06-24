"""
resonator — factorize an FHRR binding back into its factors (the VSA-native search).

Given c = f1 ⊙ f2 ⊙ ... ⊙ fF (element-wise complex product of unit-magnitude hypervectors), recover the
codebook index of each factor WITHOUT brute-forcing the product space ∏|codebook_f|. A resonator network
(Kent, Frady, Sommer, Olshausen 2020) does it by iterated unbind-project, converging to a fixed point.

Learned in .labs (the hard way): the canonical Jacobi-from-superposition init alone STALLS; what converges
in a handful of iterations is **Gauss-Seidel updates + random restarts (different inits) + OLS projection**.
Measured: 15/15 at M=1k (median 5 iters), 13/15 at M=512k.

Honesty contract: `factorize` returns `(indices, verified)`. `verified` recomposes ⊙ and checks cosine to
c — an unverified result (limit cycle / above capacity) must NOT be trusted. The flag IS the contract.

CPU/numpy complex (safe; the MPS complex bug only affects the GPU path). Pairs with the phase-angle
carrier: a codebook row is `np.exp(1j*theta)`; `from_phase`/`to_phase` convert.
"""
import numpy as np


def from_phase(theta):
    return np.exp(1j * np.asarray(theta, float))


def to_phase(v):
    return np.angle(v)


def _unit(v):
    return v / (np.abs(v) + 1e-12)


class Resonator:
    def __init__(self, codebooks):
        """codebooks: list of (n_f, D) complex unit-magnitude arrays (rows = codewords)."""
        self.cbs = [np.asarray(cb) for cb in codebooks]
        self.Xs = [cb.T for cb in self.cbs]                       # (D, n)
        self.Xdag = [np.linalg.pinv(cb.T) for cb in self.cbs]     # (n, D) OLS, precomputed once

    def _iterate(self, c, init, iters, tol):
        est = [_unit(e.copy()) for e in init]
        for it in range(iters):
            change = 0.0
            for f in range(len(est)):
                o = c.copy()
                for g in range(len(est)):
                    if g != f:
                        o = o * np.conj(est[g])                   # unbind the other (latest) factors
                newf = _unit(self.Xs[f] @ (self.Xdag[f] @ o))    # project onto codebook span (OLS)
                change += float(np.mean(np.abs(newf - est[f])))
                est[f] = newf                                    # Gauss-Seidel: in-place
            if change < tol:
                return est, it
        return est, iters - 1

    def _decode(self, est):
        return [int(np.argmax(np.real(cb.conj() @ est[f]))) for f, cb in enumerate(self.cbs)]

    def _recompose(self, idx):
        v = self.cbs[0][idx[0]].copy()
        for f in range(1, len(self.cbs)):
            v = v * self.cbs[f][idx[f]]
        return v

    def factorize(self, c, restarts=8, iters=300, tol=1e-7, seed=0, accept=0.99):
        """Return (indices, verified). verified=False -> do not trust (limit cycle / above capacity)."""
        c = np.asarray(c)
        rng = np.random.default_rng(seed)
        D = c.shape[0]
        inits = [[_unit(cb.sum(0)) for cb in self.cbs]]           # restart 0: canonical superposition
        for _ in range(restarts - 1):
            inits.append([_unit(np.exp(1j * rng.uniform(-np.pi, np.pi, D))) for _ in self.cbs])
        best = (None, -1.0)
        for init in inits:
            est, _ = self._iterate(c, init, iters, tol)
            dec = self._decode(est)
            rec = self._recompose(dec)
            cs = float(np.real(np.vdot(rec, c)) / (np.linalg.norm(rec) * np.linalg.norm(c) + 1e-12))
            if cs >= accept:
                return dec, True
            if cs > best[1]:
                best = (dec, cs)
        return best[0], False
