"""
personal_os — YOUR OWN AGENTIC OS. Everyone builds their own, PRIVATELY, inside `.local`.

This is the PUBLIC template; your RUNTIME instantiates it against your private root (`.local`).
Article 0: this code never creates or reads `.local` — YOU pass the root yourself
(`scaffold(".local")`), and this dev/test path only ever scaffolds a temp dir. The OS's own contents
live in `.local`; only de-identified lessons leave, and only through `publish_guard`.

The OS binds the ark foundation into one private, autonomous research+trading environment:
  a private vault (trigram IP) · a local inference engine · the HUMANITIK partner register ·
  the safe autonomous core · a private calibration memory.
"""
import os
import json
import numpy as np

from foundation.operator import inference
from foundation.operator.autonomous import RiskConfig, run_autonomous
from foundation.commons import registry
from foundation.privacy import publish_guard

OS_LAYOUT = ["vault", "theses", "calibration", "index.local"]     # the private OS directory shape


def scaffold(root):
    """Lay out a personal-OS directory under `root`. At runtime YOU point `root` at `.local`; this
    builds the structure your private OS lives in. Returns the root. (Tested against a temp dir — this
    dev process never targets `.local`.)"""
    os.makedirs(root, exist_ok=True)
    for d in OS_LAYOUT:
        os.makedirs(os.path.join(root, d), exist_ok=True)
    cfg = os.path.join(root, "os.config.json")
    if not os.path.exists(cfg):
        with open(cfg, "w") as f:
            json.dump({"engine": "stub", "broker": "paper", "risk": "conservative",
                       "owner": "you", "private": True}, f, indent=2)
    return root


class PersonalOS:
    """One person's agentic OS — bind a (private) vault + engine + register + risk, then think and run."""

    def __init__(self, vault, engine=None, register=None, risk=None, owner="you"):
        self.vault = vault
        self.engine = engine or inference.get_engine()
        self.register = register or registry.default_register()
        self.risk = risk or RiskConfig()
        self.owner = owner
        self.calibration = []                                    # private post-trade memory (stays local)

    def think(self, thesis):
        """The operator proposes a strategy genome from a macro thesis (the LLM proposes)."""
        return self.engine.propose(thesis)

    def run(self, prices, seed=0):
        """Autonomously paper-trade the private vault's strategies through the safe core."""
        out = run_autonomous(self.vault, prices, np.random.default_rng(seed), risk=self.risk)
        self.calibration.append({"n_sessions": len(out["sessions"]), "mode": out["mode"]})
        return out

    def contribute(self, lesson):
        """Offer a DE-IDENTIFIED lesson to the public commons. Article 0: routes through publish_guard;
        anything carrying `.local` provenance is refused. Attribution is HUMANITIK."""
        text = lesson if isinstance(lesson, str) else json.dumps(lesson)
        publish_guard.assert_publishable(text)
        return {"contributed": lesson, "license": "HUMANITIK", "owner": self.owner}
