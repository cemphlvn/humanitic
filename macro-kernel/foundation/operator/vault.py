"""
vault — the strategy-vault interface. Article 0: the REAL vault is `.local` (runtime-written,
private trigram IP); this module never creates or reads `.local`. Tests and dev use the in-memory
vault of PUBLIC fixtures. `LocalVault` is the runtime reader the system points at its private vault
to TRADE its own strategies locally — reading private IP for local execution is allowed (Article 0
governs PUBLISHING, not the runtime reading its own data); it must never feed `publish_guard`.
"""
import os
import json
import glob


class InMemoryVault:
    """Public fixtures standing in for private `.local` trigram IP (dev/test)."""
    def __init__(self, trigrams):
        self._t = [list(t) for t in trigrams]

    def list_strategies(self):
        return [list(t) for t in self._t]


class LocalVault:
    """RUNTIME ONLY: read trigram strategy files from a private vault dir (the runtime points `path`
    at `.local`). The dev/test path never instantiates this on a `.local` directory."""
    def __init__(self, path):
        self.path = path

    def list_strategies(self):
        out = []
        for p in sorted(glob.glob(os.path.join(self.path, "*.json"))):
            with open(p) as f:
                out.append(list(json.load(f)["trigram"]))
        return out
