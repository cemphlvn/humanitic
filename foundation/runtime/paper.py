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


def run_paper(write_local=True):
    acct = _load() if (write_local and os.path.exists(ACCOUNT)) else PaperAccount()
    pos, r = _strategy(seed=acct.n_steps + 1)                # a fresh period each call -> advances forward
    summ = acct.run(pos, r)
    if write_local:
        _save(acct)
        summ["account"] = ACCOUNT
    summ["caveat"] = "synthetic replay strategy (planted) — paper trading validates the LEDGER; a live feed replaces it"
    return summ


def run_fit(seed=0):
    feat, fwd, _ = unsupervised.synth_regime_world(n=2000, seed=seed)
    pos, r, _ = unsupervised.dynamic_trade(feat, fwd, seed=seed)
    return interval_fit.fit(pos, r, intervals=(1, 2, 4, 8, 16, 32))
