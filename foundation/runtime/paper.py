"""
paper — run PAPER TRADING (simulated money; the LIVE gate stays shut) and the time-interval-infra-fit
sweep. The persistent paper account lives in `.local/paper/` (private, owner-directed). "From now on" =
each call advances the SAME account with a fresh period — a continuous forward test.
"""
import os
import json

import numpy as np

from foundation.regime import unsupervised
from foundation.execution.paper_account import PaperAccount
from foundation.eval import interval_fit

ACCOUNT = os.path.join(".local", "paper", "account.json")


def _strategy(seed, n=1200):
    """The (replay) positions+returns the paper account trades. Synthetic regime world — flagged; a live
    feed replaces it. dynamic_trade gives causal 1-step-ahead positions."""
    feat, fwd, _ = unsupervised.synth_regime_world(n=n, seed=seed)
    pos, r, _ = unsupervised.dynamic_trade(feat, fwd, seed=seed)
    return np.clip(pos, -1.0, 1.0), r


def _load():
    with open(ACCOUNT) as f:
        return PaperAccount.from_dict(json.load(f))


def _save(acct):
    os.makedirs(os.path.dirname(ACCOUNT), exist_ok=True)
    with open(ACCOUNT, "w") as f:
        json.dump(acct.to_dict(), f)
    try:
        os.chmod(ACCOUNT, 0o600)
    except OSError:
        pass


def choose_interval(seed=0):
    """Run the time-interval-infra-fit and return its best timeframe (fallback to 1 if none is skilled)."""
    res = run_fit(seed=seed)
    best = res.get("best_fit")
    return (best["interval"] if best else 1), res


def run_paper(write_local=True, refit=False):
    acct = _load() if (write_local and os.path.exists(ACCOUNT)) else PaperAccount()
    chosen = None
    if acct.interval is None or refit:
        acct.interval, fit = choose_interval(seed=0)          # pick the timeframe ONCE (or on --refit)
        chosen = {"interval": acct.interval, "n_trials": fit["n_trials"],
                  "best_dsr": (fit["best_fit"]["deflated_sharpe"] if fit["best_fit"] else None)}

    pos, r = _strategy(seed=acct.n_steps + 1)                 # a fresh period each call -> advances forward
    s, rk = interval_fit.resample(pos, r, acct.interval)      # TRADE AT THE FITTED INTERVAL
    summ = acct.run(np.clip(s, -1.0, 1.0), rk)
    if chosen:
        summ["interval_chosen"] = chosen
    if write_local:
        _save(acct)
        summ["account"] = ACCOUNT
    summ["caveat"] = "synthetic replay strategy (planted) — paper trading validates the LEDGER + the " \
                     "interval wiring; a live feed replaces it"
    return summ


FIT_INTERVALS = (1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256)


PORTFOLIO = os.path.join(".local", "paper", "portfolio.json")


def run_portfolio(write_local=True):
    """Trade the assembled BOOK forward on a persistent portfolio paper account: build the book, take the
    allocator's weight vector, compound its combined return stream. The portfolio is a superposition of
    many small uncorrelated edges, not one opinion. Win metrics ride on the combined stream."""
    from foundation.portfolio import loop, allocator
    book, w, summary = loop.assemble()
    pr = allocator.portfolio_returns(book, w)                 # the combined per-bar P&L (w applied)
    acct = (PaperAccount.from_dict(json.load(open(PORTFOLIO)))
            if (write_local and os.path.exists(PORTFOLIO)) else PaperAccount())
    s = acct.run(np.ones(len(pr)), pr)                        # compound the PORTFOLIO forward
    if write_local:
        os.makedirs(os.path.dirname(PORTFOLIO), exist_ok=True)
        with open(PORTFOLIO, "w") as f:
            json.dump(acct.to_dict(), f)
        try:
            os.chmod(PORTFOLIO, 0o600)
        except OSError:
            pass
        s["account"] = PORTFOLIO
    s["book"] = {"size": summary["book_size"], "edges": summary["edges"],
                 "diversified_ir": summary["diversified_ir"], "weights": summary["weights"]}
    s["caveat"] = "synthetic candidates (planted) — validates book->paper wiring; live discovery replaces it"
    return s


def run_fit(seed=0, n=8000, intervals=FIT_INTERVALS, lookback=2000):
    """Time-interval-infra-fit across MANY intervals over a LONG history. Rolling-lookback regimes keep
    it O(n) and memory-safe; the Deflated Sharpe's n_trials = #feasible intervals (more intervals = a
    stronger multiple-testing haircut)."""
    feat, fwd, _ = unsupervised.synth_regime_world(n=n, seed=seed)
    pos, r, _ = unsupervised.dynamic_trade(feat, fwd, seed=seed, lookback=lookback)
    return interval_fit.fit(pos, r, intervals=intervals)
