"""Article 0 guards: publish guard (0.2), gitignore cross-check (0.1), guard present (0.3)."""
import os
import numpy as np
from foundation.privacy import publish_guard

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run():
    assert publish_guard.is_publishable("buy energy on the AI-capex thesis") is True
    assert publish_guard.is_publishable(".local/positions.json") is False
    assert publish_guard.is_publishable("see config/.local/secret") is False
    assert publish_guard.is_publishable("PRIVATE:: my thesis") is False

    # fuzz: every .local-tagged export must be blocked -> 0 leaks / 100
    leaks = 0
    for i in range(100):
        private = (i % 3 == 0)
        art = f".local/e{i}" if private else f"public note {i}"
        if private and publish_guard.is_publishable(art):
            leaks += 1
    assert leaks == 0, f"{leaks} .local leaks"

    assert publish_guard.gitignore_hardens_local(REPO) is True          # 0.1
    assert publish_guard.guard_is_present() is True                     # 0.3
    assert os.path.exists(os.path.join(REPO, "foundation", "privacy", "publish_guard.py"))
    print("test_constitution: OK")
    return True


if __name__ == "__main__":
    run()
